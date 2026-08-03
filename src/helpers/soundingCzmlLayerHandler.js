import {
  CzmlDataSource,
  JulianDate,
  ClockRange,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  ConstantProperty,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
} from "cesium"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"
import {
  OSWEGO_SOUNDING_START_COLOR,
  OSWEGO_SOUNDING_END_COLOR,
  NSSL_SOUNDING_START_COLOR,
  NSSL_SOUNDING_END_COLOR,
} from "./leeVizColors"

function getSoundingMarkerStyle(layer) {
  const shortName = layer?.shortName
  if (shortName === "leeoswegosoundings") {
    return {
      launchLabel: layer.launchLabel || "Oswego Launch",
      endLabel: layer.endLabel || "Oswego Landing",
      launchColor: layer.launchMarkerColor || OSWEGO_SOUNDING_START_COLOR,
      endColor: layer.endMarkerColor || OSWEGO_SOUNDING_END_COLOR,
    }
  }
  if (shortName === "leensslmobilesounding") {
    return {
      launchLabel: layer.launchLabel || "NSSL Launch",
      endLabel: layer.endLabel || "NSSL Landing",
      launchColor: layer.launchMarkerColor || NSSL_SOUNDING_START_COLOR,
      endColor: layer.endMarkerColor || NSSL_SOUNDING_END_COLOR,
    }
  }
  return {
    launchLabel: layer?.launchLabel || "Launch",
    endLabel: layer?.endLabel || "Landing",
    launchColor: layer?.launchMarkerColor || "#1f7aec",
    endColor: layer?.endMarkerColor || "#d94a4a",
  }
}

function entityLooksLikeLaunch(entity, layer) {
  const id = String(entity?.id || "").toLowerCase()
  const name = String(entity?.name || "").toLowerCase()
  const launchId = String(layer?.launchEntityId || "launch_site").toLowerCase()

  return (
    id === launchId ||
    id.includes("launch") ||
    name.includes("launch") ||
    name.includes("launch site")
  )
}

function entityLooksLikeEnd(entity, layer) {
  const id = String(entity?.id || "").toLowerCase()
  const name = String(entity?.name || "").toLowerCase()
  const endId = String(layer?.endEntityId || "landing_site").toLowerCase()

  if (entityLooksLikeLaunch(entity, layer)) return false

  return (
    id === endId ||
    id.includes("landing") ||
    id.includes("end_site") ||
    id === "end" ||
    id.endsWith("_end") ||
    name.includes("landing") ||
    name === "end" ||
    name.includes("termination")
  )
}

function styleSoundingMarker(entity, labelText, cssColor) {
  const color = Color.fromCssColorString(cssColor)

  entity.name = labelText

  // Prefer our own point marker so CZML billboards / baked colors cannot override legend colors.
  if (entity.billboard) {
    entity.billboard.show = new ConstantProperty(false)
  }

  entity.point = {
    show: true,
    color,
    outlineColor: Color.WHITE,
    outlineWidth: 2,
    pixelSize: 14,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  }

  entity.label = {
    show: true,
    text: labelText,
    fillColor: color,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    style: LabelStyle.FILL_AND_OUTLINE,
    font: "bold 14px sans-serif",
    verticalOrigin: VerticalOrigin.BOTTOM,
    pixelOffset: new Cartesian2(0, -18),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  }
}

function synthesizeLandingMarker(dataSource, layer, style) {
  if (!dataSource?.entities) return

  const hasEnd = dataSource.entities.values.some((entity) => entityLooksLikeEnd(entity, layer))
  if (hasEnd) return

  const track =
    dataSource.entities.getById("Flight Track") ||
    dataSource.entities.values.find((entity) => {
      const id = String(entity?.id || "").toLowerCase()
      const name = String(entity?.name || "").toLowerCase()
      return (
        !!entity?.position &&
        (id.includes("track") ||
          id.includes("balloon") ||
          name.includes("track") ||
          name.includes("balloon") ||
          name.includes("sounding"))
      )
    })

  if (!track?.position) return

  let endPosition = null
  try {
    const clock = getSoundingCzmlClock(dataSource)
    const stopTime = clock?.stopTime
    if (stopTime && typeof track.position.getValue === "function") {
      endPosition = track.position.getValue(stopTime)
    }
  } catch {
    // fall through to availability sampling
  }

  if (!endPosition && track.availability?.stop) {
    try {
      endPosition = track.position.getValue(track.availability.stop)
    } catch {
      // ignore
    }
  }

  if (!endPosition) return

  const endEntity = dataSource.entities.add({
    id: layer?.endEntityId || "landing_site",
    name: style.endLabel,
    position: endPosition,
    point: {
      show: true,
      pixelSize: 14,
      color: Color.fromCssColorString(style.endColor),
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      show: true,
      text: style.endLabel,
      fillColor: Color.fromCssColorString(style.endColor),
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      style: LabelStyle.FILL_AND_OUTLINE,
      font: "bold 14px sans-serif",
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -18),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })

  return endEntity
}

function stabilizeSoundingEntities(dataSource, layer) {
  const infinity = Number.POSITIVE_INFINITY
  const style = getSoundingMarkerStyle(layer)

  dataSource.entities.values.forEach((entity) => {
    try {
      if (entity.point) {
        entity.point.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.billboard) {
        entity.billboard.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.path) {
        entity.path.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.label) {
        entity.label.disableDepthTestDistance = new ConstantProperty(infinity)
      }

      if (entityLooksLikeLaunch(entity, layer)) {
        styleSoundingMarker(entity, style.launchLabel, style.launchColor)
      } else if (entityLooksLikeEnd(entity, layer)) {
        styleSoundingMarker(entity, style.endLabel, style.endColor)
      }
    } catch (err) {
      console.warn("Could not stabilize sounding entity:", entity?.id, err)
    }
  })

  try {
    synthesizeLandingMarker(dataSource, layer, style)
  } catch (err) {
    console.warn("Could not synthesize sounding landing marker:", err)
  }
}

export function getSoundingCzmlClock(dataSource) {
  if (!dataSource?.clock) return null

  try {
    if (typeof dataSource.clock.getValue === "function") {
      const clockValue = dataSource.clock.getValue()
      if (clockValue?.startTime && clockValue?.stopTime) {
        return clockValue
      }
    }

    if (dataSource.clock.startTime && dataSource.clock.stopTime) {
      return dataSource.clock
    }
  } catch (err) {
    console.warn("Could not read CZML clock:", err)
  }

  return null
}

function getCzmlClockSettings(dataSource) {
  return getSoundingCzmlClock(dataSource)
}

export function syncSoundingCzmlAtViewerTime(viewer, entry, active) {
  const refs = entry?.soundingCzmlRefs
  if (!viewer || viewer.isDestroyed?.() || !refs) return

  const dataSources = refs.dataSources?.length
    ? refs.dataSources
    : refs.dataSource
      ? [refs.dataSource]
      : entry?.cesiumLayerRef
        ? [entry.cesiumLayerRef]
        : []

  dataSources.forEach((dataSource) => {
    if (!dataSource) return
    dataSource.show = active !== false
  })

  viewer.scene.requestRender()
}

export function applySoundingCzmlClockToViewer(viewer, layerObject) {
  const { layer, cesiumLayerRef } = layerObject || {}
  if (!viewer || viewer.isDestroyed?.() || !layer?.useCzmlClock || !cesiumLayerRef) {
    return false
  }

  const czmlClock = getSoundingCzmlClock(cesiumLayerRef)
  if (!czmlClock) return false

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.clock.startTime = czmlClock.startTime.clone()
  viewer.clock.stopTime = czmlClock.stopTime.clone()
  viewer.clock.currentTime = czmlClock.startTime.clone()
  viewer.clock.multiplier = czmlClock.multiplier ?? layer.clockMultiplier ?? 30
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(czmlClock.startTime, czmlClock.stopTime)
  }

  return true
}

function applySoundingClock(viewer, layer, dataSource) {
  const czmlClock = getCzmlClockSettings(dataSource)
  const useCzmlClock = layer.useCzmlClock && czmlClock

  let startTime
  let endTime
  let multiplier = layer.clockMultiplier || 30

  if (useCzmlClock) {
    startTime = czmlClock.startTime.clone()
    endTime = czmlClock.stopTime.clone()
    multiplier = czmlClock.multiplier ?? multiplier
  } else {
    startTime = JulianDate.fromIso8601(layer.start || "2022-11-18T23:57:00Z")
    endTime = JulianDate.fromIso8601(layer.end || "2022-11-19T01:20:00Z")
  }

  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = endTime.clone()
  viewer.clock.currentTime = startTime.clone()
  viewer.clock.multiplier = multiplier
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, endTime)
  }

  return startTime
}

function focusCameraOnSounding(viewer, dataSource, layer, clockTime) {
  if (!viewer || viewer.isDestroyed?.()) return

  const offset = layer.cameraOffset || {
    lonDelta: -0.025,
    latDelta: -0.025,
    minAlt: 3500,
    altAboveLaunch: 3500,
  }

  if (layer.launch) {
    const cameraPosition = Cartesian3.fromDegrees(
      layer.launch.lon + (offset.lonDelta ?? -0.018),
      layer.launch.lat + (offset.latDelta ?? -0.018),
      offset.fixedAlt ?? 4500
    )
    const launchTarget = Cartesian3.fromDegrees(
      layer.launch.lon,
      layer.launch.lat,
      layer.launch.alt
    )
    const direction = Cartesian3.normalize(
      Cartesian3.subtract(launchTarget, cameraPosition, new Cartesian3()),
      new Cartesian3()
    )

    viewer.camera.setView({
      destination: cameraPosition,
      orientation: { direction, up: Cartesian3.UNIT_Z },
    })
    return
  }

  const launchEntity = dataSource.entities.getById(layer.launchEntityId || "launch_site")
  if (!launchEntity?.position) {
    viewer.zoomTo(dataSource)
    return
  }

  const launchCartesian = launchEntity.position.getValue(clockTime)
  if (!launchCartesian) {
    viewer.zoomTo(dataSource)
    return
  }

  const launchCartographic = Cartographic.fromCartesian(launchCartesian)
  const launchLon = CesiumMath.toDegrees(launchCartographic.longitude)
  const launchLat = CesiumMath.toDegrees(launchCartographic.latitude)
  const launchAlt = launchCartographic.height

  const cameraPosition = Cartesian3.fromDegrees(
    launchLon + (offset.lonDelta ?? -0.025),
    launchLat + (offset.latDelta ?? -0.025),
    offset.fixedAlt ?? Math.max(offset.minAlt ?? 3500, launchAlt + (offset.altAboveLaunch ?? 3500))
  )
  const launchTarget = Cartesian3.fromDegrees(launchLon, launchLat, launchAlt)
  const direction = Cartesian3.normalize(
    Cartesian3.subtract(launchTarget, cameraPosition, new Cartesian3()),
    new Cartesian3()
  )

  viewer.camera.setView({
    destination: cameraPosition,
    orientation: { direction, up: Cartesian3.UNIT_Z },
  })
}

function getSoundingDataSources(soundingCzmlRefs) {
  if (soundingCzmlRefs?.dataSources?.length) {
    return soundingCzmlRefs.dataSources
  }
  if (soundingCzmlRefs?.dataSource) {
    return [soundingCzmlRefs.dataSource]
  }
  return []
}

export function unloadSoundingCzmlLayer(viewer, soundingCzmlRefs) {
  if (!viewer || viewer.isDestroyed?.()) return

  getSoundingDataSources(soundingCzmlRefs).forEach((dataSource) => {
    try {
      viewer.dataSources.remove(dataSource, true)
    } catch (err) {
      console.warn("Could not remove sounding CZML data source:", err)
    }
  })
}

function getSoundingCzmlUrls(layer) {
  if (layer.czmlLocations?.length) {
    return [...new Set(layer.czmlLocations.filter((url) => url && !url.includes("undefined")))]
  }

  const urls = [layer.czmlLocation, ...(layer.czmlAlternates || [])].filter(
    (url) => url && !url.includes("undefined")
  )

  return [...new Set(urls)]
}

function loadCzmlFromUrl(url) {
  return new Promise((resolve, reject) => {
    const loadPromise = CzmlDataSource.load(url)

    const onReady = (dataSource) => resolve({ dataSource, url })
    const onError = (err) => reject(err)

    if (typeof loadPromise.otherwise === "function") {
      loadPromise.then(onReady).otherwise(onError)
    } else {
      loadPromise.then(onReady).catch(onError)
    }
  })
}

async function loadFirstAvailableSoundingCzml(layer) {
  const urls = getSoundingCzmlUrls(layer)

  if (!urls.length) {
    throw new Error(`Missing CZML URL for ${layer?.displayName || "sounding layer"}`)
  }

  let lastError = null

  for (const url of urls) {
    try {
      const result = await loadCzmlFromUrl(url)
      console.log(`Loaded ${layer.displayName} from ${url}`)
      return [result]
    } catch (err) {
      lastError = err
      console.warn(`Sounding CZML not available at ${url}`)
    }
  }

  throw lastError || new Error(`Could not load ${layer.displayName} from any candidate URL`)
}

async function loadAllSoundingCzml(layer) {
  const urls = getSoundingCzmlUrls(layer)

  if (!urls.length) {
    throw new Error(`Missing CZML URL for ${layer?.displayName || "sounding layer"}`)
  }

  const results = []
  let lastError = null

  for (const url of urls) {
    try {
      const result = await loadCzmlFromUrl(url)
      console.log(`Loaded ${layer.displayName} from ${url}`)
      results.push(result)
    } catch (err) {
      lastError = err
      console.warn(`Sounding CZML not available at ${url}`)
    }
  }

  if (!results.length) {
    throw lastError || new Error(`Could not load ${layer.displayName} from any candidate URL`)
  }

  return results
}

async function loadSoundingCzmlSources(layer) {
  if (layer.czmlLocations?.length) {
    return loadAllSoundingCzml(layer)
  }

  return loadFirstAvailableSoundingCzml(layer)
}

export function loadSoundingCzmlLayer(viewer, layer, options = {}) {
  const { flyOnLoad = true } = options
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false

  return loadSoundingCzmlSources(layer)
    .then((results) => {
      if (!isLayerLoadActive(layerId, session)) {
        return null
      }

      const dataSources = results.map(({ dataSource }) => dataSource)
      const primaryDataSource = dataSources[0]
      const loadedUrl = results[0]?.url

      try {
        if (viewer.isDestroyed?.()) {
          return {
            cesiumLayerRef: primaryDataSource,
            soundingCzmlRefs: { dataSource: primaryDataSource, dataSources },
          }
        }

        dataSources.forEach((dataSource) => stabilizeSoundingEntities(dataSource, layer))
        let clockTime = viewer.clock.currentTime
        if (!options.skipViewerClock) {
          clockTime = applySoundingClock(viewer, layer, primaryDataSource)
        }
        dataSources.forEach((dataSource) => viewer.dataSources.add(dataSource))
        if (flyOnLoad) {
          focusCameraOnSounding(viewer, primaryDataSource, layer, clockTime)
        }

        const entry = {
          layer,
          soundingCzmlRefs: { dataSource: primaryDataSource, dataSources },
        }
        if (options.skipViewerClock) {
          syncSoundingCzmlAtViewerTime(viewer, entry, true)
        }

        return {
          cesiumLayerRef: primaryDataSource,
          soundingCzmlRefs: { dataSource: primaryDataSource, dataSources },
        }
      } catch (err) {
        console.error(`Failed to initialize sounding layer from ${loadedUrl}:`, err)
        throw err
      }
    })
}
