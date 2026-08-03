import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  JulianDate,
  ClockRange,
} from "cesium"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

export function unloadLma3dtileLayer(viewer, lma3dtileRefs) {
  if (!lma3dtileRefs?.tileset || !viewer || viewer.isDestroyed?.()) return

  try {
    viewer.scene.primitives.remove(lma3dtileRefs.tileset)
  } catch (err) {
    console.warn("Could not remove LMA tileset:", err)
  }
}

export function loadLma3dtileLayer(viewer, layer, options = {}) {
  const { flyOnLoad = true, pointSize = 4.0, skipViewerClock = false } = options
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)

  const tileset = new Cesium3DTileset({
    url: layer.tileLocation,
    skipLevelOfDetail: true,
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 16,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cullWithChildrenBounds: true,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 2.0e-4,
    dynamicScreenSpaceErrorFactor: 24.0,
    dynamicScreenSpaceErrorHeightFalloff: 0.25,
  })

  tileset.style = new Cesium3DTileStyle({
    color: "${COLOR}",
    pointSize,
  })

  viewer.scene.primitives.add(tileset)

  if (!options.skipViewerClock) {
    const startTime = JulianDate.fromIso8601(layer.start || "2022-11-18T00:00:00Z")
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
  }

  return new Promise((resolve, reject) => {
    const readyPromise = tileset.readyPromise

    const onReady = () => {
      if (!isLayerLoadActive(layerId, session)) {
        if (!viewer.isDestroyed?.()) {
          try {
            viewer.scene.primitives.remove(tileset)
          } catch (err) {
            console.warn("Could not remove cancelled LMA tileset:", err)
          }
        }
        resolve(null)
        return
      }

      if (viewer.isDestroyed?.()) {
        resolve({ cesiumLayerRef: tileset, lma3dtileRefs: { tileset } })
        return
      }

      if (flyOnLoad) {
        viewer.zoomTo(tileset)
      }
      resolve({
        cesiumLayerRef: tileset,
        lma3dtileRefs: { tileset },
      })
    }

    const onError = (err) => {
      console.error("LMA tileset.readyPromise failed:", err)
      reject(err)
    }

    if (readyPromise?.then) {
      if (typeof readyPromise.otherwise === "function") {
        readyPromise.then(onReady).otherwise(onError)
      } else {
        readyPromise.then(onReady).catch(onError)
      }
    } else {
      onError(new Error("LMA tileset has no readyPromise"))
    }
  })
}
