import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  CzmlDataSource,
  JulianDate,
  ClockRange,
  Cartesian2,
  Cartesian3,
  Math as CesiumMath,
} from "cesium"
import emitter from "./event"
import { probeResourceUrl } from "./leeDataAvailability"
import { leeInstrumentIopPath } from "../config"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

const DOW7_CENTER_LON = -76.026593
const DOW7_CENTER_LAT = 43.990895
const DOW7_CENTER_ALT = 95.0
const DOW7_RADIUS = 62427

function getDowPointSize(cameraHeight) {
  if (cameraHeight > 800000) return 16.0
  if (cameraHeight > 500000) return 14.0
  if (cameraHeight > 300000) return 12.0
  if (cameraHeight > 180000) return 10.0
  if (cameraHeight > 100000) return 8.0
  return 6.0
}

function getDow7TileUrlCandidates(layer, level) {
  const urls = new Set()
  const primary = level === "high" ? layer?.highTileLocation : layer?.lowTileLocation
  if (primary) urls.add(primary)

  const iopFolder = layer?.leeDataSubfolders?.[0]
  if (iopFolder) {
    urls.add(leeInstrumentIopPath("Mobile_radar", iopFolder, level, "tileset.json"))
  }

  const legacyLevel = level === "high" ? "dow7_3dtiles_high" : "dow7_3dtiles_low"
  urls.add(leeInstrumentIopPath("Mobile_radar", legacyLevel, "tileset.json"))

  return [...urls].filter(Boolean)
}

function flyToDowCenter(viewer, centerInfo) {
  if (!viewer || viewer.isDestroyed?.()) return

  const cameraHeight = Math.max(centerInfo.radius * 2.8, 170000)

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(centerInfo.lon, centerInfo.lat, cameraHeight),
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-90),
      roll: 0,
    },
    duration: 1.5,
  })
}

function applyPointCloudStyle(tilesets, pointSize) {
  const style = new Cesium3DTileStyle({
    pointSize,
  })

  tilesets.forEach((tileset) => {
    if (tileset) tileset.style = style
  })
}

function removeDowReflectivityLegend() {
  const existingLegend = document.getElementById("dow-reflectivity-legend")
  if (existingLegend?.parentNode) {
    existingLegend.parentNode.removeChild(existingLegend)
  }
}

async function loadTilesetFromCandidates(viewer, layer, level, tilesetOptions, required) {
  const candidates = getDow7TileUrlCandidates(layer, level)

  for (const url of candidates) {
    try {
      const exists = await probeResourceUrl(url)
      if (!exists) continue

      const tileset = new Cesium3DTileset({
        url,
        ...tilesetOptions,
      })

      viewer.scene.primitives.add(tileset)
      await tileset.readyPromise

      console.log(`Loaded DOW7 ${level} tileset: ${url}`)
      return { tileset, url }
    } catch (err) {
      console.warn(`DOW7 ${level} tileset failed at candidate`, err)
    }
  }

  if (required) {
    throw new Error(
      `Could not load DOW7 ${level} tileset. Tried: ${candidates.join(", ")}`
    )
  }

  return { tileset: null, url: null }
}

export function unloadDow7Layer(viewer, dow7Refs) {
  if (!dow7Refs) return

  if (dow7Refs.homeShortcutHandler) {
    window.removeEventListener("keydown", dow7Refs.homeShortcutHandler)
  }

  if (dow7Refs.preRenderHandler && viewer?.scene?.preRender) {
    try {
      viewer.scene.preRender.removeEventListener(dow7Refs.preRenderHandler)
    } catch (err) {
      console.warn("Could not remove DOW7 preRender handler:", err)
    }
  }

  removeDowReflectivityLegend()
  emitter.emit("dow7LowDbzState", false)

  if (dow7Refs.lowDbzChangeHandler) {
    emitter.off("dow7LowDbzChange", dow7Refs.lowDbzChangeHandler)
  }

  const viewerDestroyed = viewer?.isDestroyed?.()

  if (!viewerDestroyed && viewer?.scene?.primitives) {
    ;[dow7Refs.highDbzTileset, dow7Refs.lowDbzTileset].forEach((tileset) => {
      if (!tileset) return
      try {
        viewer.scene.primitives.remove(tileset)
      } catch (err) {
        console.warn("Could not remove DOW7 tileset:", err)
      }
    })
  }

  if (!viewerDestroyed && dow7Refs.surfaceObs) {
    try {
      viewer.dataSources.remove(dow7Refs.surfaceObs)
    } catch (err) {
      console.warn("Could not remove DOW7 surface observations:", err)
    }
  }
}

export function loadDow7Layer(viewer, layer) {
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)

  const centerInfo = layer.center || {
    lon: DOW7_CENTER_LON,
    lat: DOW7_CENTER_LAT,
    alt: DOW7_CENTER_ALT,
    radius: DOW7_RADIUS,
  }

  const tilesetOptions = {
    maximumScreenSpaceError: 1,
    dynamicScreenSpaceError: false,
    skipLevelOfDetail: false,
    immediatelyLoadDesiredLevelOfDetail: true,
    loadSiblings: true,
    cullWithChildrenBounds: false,
    cullRequestsWhileMoving: false,
    preloadWhenHidden: true,
    preferLeaves: true,
  }

  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.fog.enabled = false
  viewer.scene.globe.enableLighting = false
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false
  viewer.scene.requestRenderMode = false

  const startTime = JulianDate.fromIso8601(layer.start || "2022-11-18T19:00:00Z")
  const endTime = JulianDate.fromIso8601(layer.end || "2022-11-19T06:00:00Z")

  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = endTime.clone()
  viewer.clock.currentTime = startTime.clone()
  viewer.clock.multiplier = 60
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, endTime)
  }

  return loadTilesetFromCandidates(viewer, layer, "high", tilesetOptions, true)
    .then(({ tileset: highTileset }) => {
      let currentPointSize = 6.0
      let lowDbzVisible = false
      let lowTileset = null

      highTileset.show = true
      applyPointCloudStyle([highTileset], currentPointSize)

      const preRenderHandler = () => {
        if (viewer.isDestroyed?.()) return
        const cameraHeight = viewer.camera.positionCartographic.height
        const nextPointSize = getDowPointSize(cameraHeight)
        if (nextPointSize !== currentPointSize) {
          currentPointSize = nextPointSize
          applyPointCloudStyle(
            [highTileset, lowTileset].filter(Boolean),
            currentPointSize
          )
        }
      }

      viewer.scene.preRender.addEventListener(preRenderHandler)

      const setLowDbzVisible = (visible) => {
        lowDbzVisible = !!visible
        if (lowTileset) {
          lowTileset.show = lowDbzVisible
        }
        emitter.emit("dow7LowDbzState", lowDbzVisible)
        viewer.scene.requestRender()
      }

      const lowDbzChangeHandler = (visible) => setLowDbzVisible(visible)
      emitter.on("dow7LowDbzChange", lowDbzChangeHandler)
      emitter.emit("dow7LowDbzState", lowDbzVisible)

      const homeShortcutHandler = (event) => {
        if (event.key === "h" || event.key === "H") {
          flyToDowCenter(viewer, centerInfo)
        }
        if (event.key === "o" || event.key === "O") {
          flyToDowCenter(viewer, centerInfo)
        }
        if (event.key === "d" || event.key === "D") {
          setLowDbzVisible(!lowDbzVisible)
        }
      }

      window.addEventListener("keydown", homeShortcutHandler)

      return loadTilesetFromCandidates(viewer, layer, "low", tilesetOptions, false)
        .then(({ tileset: loadedLowTileset }) => {
          lowTileset = loadedLowTileset
          if (lowTileset) {
            lowTileset.show = lowDbzVisible
            applyPointCloudStyle([highTileset, lowTileset], currentPointSize)
          }

          return { highTileset, lowTileset, preRenderHandler, homeShortcutHandler, lowDbzChangeHandler }
        })
        .catch(() => ({ highTileset, lowTileset: null, preRenderHandler, homeShortcutHandler, lowDbzChangeHandler }))
    })
    .then(async ({ highTileset, lowTileset, preRenderHandler, homeShortcutHandler, lowDbzChangeHandler }) => {
      if (viewer.isDestroyed?.()) return null
      if (!isLayerLoadActive(layerId, session)) {
        unloadDow7Layer(viewer, {
          highDbzTileset: highTileset,
          lowDbzTileset: lowTileset,
          preRenderHandler,
          homeShortcutHandler,
          lowDbzChangeHandler,
        })
        return null
      }

      try {
        await viewer.zoomTo(highTileset)
      } catch {
        flyToDowCenter(viewer, centerInfo)
      }

      let surfaceDs = null
      if (layer.surfaceCzmlLocation) {
        try {
          surfaceDs = await CzmlDataSource.load(layer.surfaceCzmlLocation)
          if (!viewer.isDestroyed?.()) {
            viewer.dataSources.add(surfaceDs)

            const entity = surfaceDs.entities.getById("dow7_surface_obs")
            if (entity) {
              if (entity.path) entity.path.show = false
              if (entity.point) {
                entity.point.pixelSize = 14
                entity.point.outlineWidth = 2
                entity.point.disableDepthTestDistance = Number.POSITIVE_INFINITY
              }
              if (entity.label) {
                entity.label.show = true
                entity.label.font = "16px sans-serif"
                entity.label.pixelOffset = new Cartesian2(0, -30)
                entity.label.disableDepthTestDistance = Number.POSITIVE_INFINITY
              }
            }
          }
        } catch (err) {
          console.warn("DOW7 surface observations not loaded (optional):", err)
        }
      }

      viewer.scene.requestRender()

      return {
        cesiumLayerRef: highTileset,
        dow7Refs: {
          highDbzTileset: highTileset,
          lowDbzTileset: lowTileset,
          surfaceObs: surfaceDs,
          preRenderHandler,
          homeShortcutHandler,
          lowDbzChangeHandler,
        },
      }
    })
}
