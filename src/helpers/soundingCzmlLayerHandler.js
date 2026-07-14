import {
  CzmlDataSource,
  JulianDate,
  ClockRange,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  ConstantProperty,
} from "cesium"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

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

function stabilizeSoundingEntities(dataSource) {
  const infinity = Number.POSITIVE_INFINITY

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
    } catch (err) {
      console.warn("Could not stabilize sounding entity:", entity?.id, err)
    }
  })
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

        dataSources.forEach((dataSource) => stabilizeSoundingEntities(dataSource))
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
