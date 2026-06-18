import {
  CzmlDataSource,
  BoundingSphere,
  HeadingPitchRange,
  HeadingPitchRoll,
  Transforms,
  CallbackProperty,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  JulianDate,
  ClockRange,
  ConstantProperty,
} from "cesium"
import emitter from "./event"
import { leeEfmBaseUrls, leeEfmCzmlPath } from "../config"
import {
  EFM_FLIGHTS,
  EFM_MODES,
  DEFAULT_EFM_VISIBLE_LAYERS,
  getDefaultEfmVisibleFlights,
  normalizeEfmVisibleFlights,
} from "./efmConstants"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

function getLayerFlights(layer) {
  return layer?.efmFlights?.length ? layer.efmFlights : EFM_FLIGHTS
}

function getLayerModeFolders(mode, layer) {
  const modeFolder = EFM_MODES[mode]?.folder
  if (!modeFolder) return []

  const iopFolders = (layer?.leeDataSubfolders || []).filter(Boolean)
  if (iopFolders.length) {
    const folders = []
    iopFolders.forEach((iopFolder) => {
      folders.push(`${iopFolder}/${modeFolder}`)
      folders.push(`${iopFolder}/output/${modeFolder}`)
    })
    return [...new Set(folders)]
  }

  return [modeFolder]
}

function getEfmBaseUrlCandidates(layer) {
  const urls = new Set()
  if (layer?.efmBaseUrl) urls.add(layer.efmBaseUrl.replace(/\/$/, ""))
  leeEfmBaseUrls.forEach((url) => {
    if (url) urls.add(url.replace(/\/$/, ""))
  })
  return [...urls]
}

function getFlightUrlCandidates(mode, flight, layer) {
  const urls = []
  const iopFolders = (layer?.leeDataSubfolders || []).filter(Boolean)

  iopFolders.forEach((iopFolder) => {
    const path = leeEfmCzmlPath(iopFolder, EFM_MODES[mode].folder, flight.file)
    if (path) urls.push(path)
  })

  const bases = getEfmBaseUrlCandidates(layer)
  const modeFolders = getLayerModeFolders(mode, layer)
  bases.forEach((base) => {
    modeFolders.forEach((folder) => {
      urls.push(`${base}/${folder}/${flight.file}`)
    })
  })

  return [...new Set(urls.filter(Boolean))]
}

function emitEfmState(efmRefs) {
  emitter.emit("efmStateChange", {
    currentMode: efmRefs.currentMode,
    flights: efmRefs.flights ? [...efmRefs.flights] : [],
    visibleFlights: { ...efmRefs.visibleFlights },
    visibleLayers: { ...efmRefs.visibleLayers },
    loadedFlights: { ...efmRefs.loadedFlights },
    failedFlights: { ...efmRefs.failedFlights },
    failedFlightUrls: { ...efmRefs.failedFlightUrls },
    efmBaseUrl: efmRefs.resolvedBaseUrl || null,
    leeDataSubfolders: efmRefs.leeDataSubfolders || [],
  })
}

function applyLayerVisibilityToDataSource(dataSource, visibleLayers) {
  const infinity = Number.POSITIVE_INFINITY

  dataSource.entities.values.forEach((entity) => {
    const id = (entity.id || "").toLowerCase()
    const name = (entity.name || "").toLowerCase()

    if (id.includes("_static_path")) {
      entity.show = visibleLayers.path
      return
    }

    if (id.includes("_moving_balloon")) {
      entity.show = true
      if (entity.point) {
        entity.point.show = visibleLayers.movingBalloon
        entity.point.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.path) entity.path.show = false
      if (entity.label) {
        entity.label.show = visibleLayers.labels
        entity.label.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      return
    }

    if (id.includes("_point_")) {
      entity.show = visibleLayers.points
      if (entity.point) {
        entity.point.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.label) {
        entity.label.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      return
    }

    if (id.includes("_drop_line_")) {
      entity.show = visibleLayers.dropLines
      return
    }

    if (
      id.includes("_launch") ||
      id.includes("_end") ||
      id.includes("_max_altitude") ||
      name.includes("launch") ||
      name.includes("max altitude") ||
      name === "end"
    ) {
      entity.show = true
      if (entity.point) {
        entity.point.show = visibleLayers.labels
        entity.point.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      if (entity.label) {
        entity.label.show = visibleLayers.labels
        entity.label.disableDepthTestDistance = new ConstantProperty(infinity)
      }
      return
    }

    entity.show = true
  })
}

function fixOrientation(entity, time) {
  const position = entity.position.getValue(time)
  if (!position || !entity.properties) return undefined

  let { heading, pitch, roll, correctionOffsets } = entity.properties.getValue(time)
  if (!correctionOffsets) {
    correctionOffsets = { heading: 0, pitch: 0, roll: 0 }
  }

  heading = heading + CesiumMath.toRadians(correctionOffsets.heading)
  pitch = pitch + CesiumMath.toRadians(correctionOffsets.pitch)
  roll = roll + CesiumMath.toRadians(correctionOffsets.roll)

  return Transforms.headingPitchRollQuaternion(
    position,
    new HeadingPitchRoll(heading, pitch, roll)
  )
}

function cancelActiveViewerFlight(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return
  viewer.trackedEntity = undefined
  try {
    viewer.camera.cancelFlight()
  } catch (err) {
    console.warn("Could not cancel EFM camera flight:", err)
  }
}

function stabilizeEfmEntities(dataSource) {
  dataSource.entities.values.forEach((entity) => {
    const id = entity.id
    if (id === undefined || id === null || id === "") {
      entity.show = false
      return
    }

    if (entity.point) {
      entity.point.disableDepthTestDistance = new ConstantProperty(Number.POSITIVE_INFINITY)
    }
    if (entity.label) {
      entity.label.disableDepthTestDistance = new ConstantProperty(Number.POSITIVE_INFINITY)
    }
  })
}

function findMovingBalloonEntity(dataSource) {
  return (
    dataSource.entities.values.find((entity) =>
      String(entity.id || "").includes("_moving_balloon")
    ) || dataSource.entities.getById("Flight Track")
  )
}

function collectStaticPathPositions(dataSource, time) {
  const staticEntity = dataSource.entities.values.find((entity) =>
    String(entity.id || "").includes("_static_path")
  )
  if (!staticEntity?.polyline?.positions) return []

  const positions = staticEntity.polyline.positions.getValue(time)
  return positions?.length ? positions : []
}

function collectEfmTrackPositions(dataSources, time) {
  const allPositions = []
  dataSources.forEach((dataSource) => {
    allPositions.push(...collectStaticPathPositions(dataSource, time))
  })

  if (!allPositions.length) {
    dataSources.forEach((dataSource) => {
      const balloon = findMovingBalloonEntity(dataSource)
      const position = balloon?.position?.getValue(time)
      if (position) allPositions.push(position)
    })
  }

  return allPositions
}

function getEfmTrackBoundingSphere(dataSources, time) {
  const positions = collectEfmTrackPositions(dataSources, time)
  if (!positions.length) return null

  const sphere = BoundingSphere.fromPoints(positions)
  sphere.radius = Math.max(sphere.radius, 1200)
  return sphere
}

function getEfmCameraRange(sphere, { close = false } = {}) {
  if (close) {
    return CesiumMath.clamp(sphere.radius * 1.6, 6000, 22000)
  }

  let maxRange = 22000
  if (sphere.radius > 18000) {
    maxRange = 36000
  } else if (sphere.radius > 10000) {
    maxRange = 28000
  }

  return CesiumMath.clamp(sphere.radius * 2.2, 10000, maxRange)
}

function flyCameraToEfmTrack(viewer, dataSources, time, { close = false } = {}) {
  if (!dataSources.length || !viewer || viewer.isDestroyed?.()) return

  cancelActiveViewerFlight(viewer)
  const sphere = getEfmTrackBoundingSphere(dataSources, time)
  if (!sphere) return

  const range = getEfmCameraRange(sphere, { close })
  viewer.camera.flyToBoundingSphere(sphere, {
    duration: 1.5,
    offset: new HeadingPitchRange(
      CesiumMath.toRadians(-40),
      CesiumMath.toRadians(-32),
      range
    ),
  })
}

function flyCameraToEfmView(viewer, dataSources, time) {
  flyCameraToEfmTrack(viewer, dataSources, time, { close: dataSources.length === 1 })
}

function applyFlightOrientationFixIfNeeded(dataSource) {
  const flightEntity = findMovingBalloonEntity(dataSource)
  if (!flightEntity?.position || !flightEntity.properties) return

  flightEntity.viewFrom = new Cartesian3(-30000, -70000, 50000)
  flightEntity.orientation = new CallbackProperty(
    (time) => fixOrientation(flightEntity, time),
    false
  )
}

function flyToDropLineView(viewer, loadedDataSources, time) {
  const sources = Object.values(loadedDataSources)
  flyCameraToEfmTrack(viewer, sources, time, { close: true })
}

function clearEfmDataSources(viewer, efmRefs) {
  cancelActiveViewerFlight(viewer)

  Object.values(efmRefs.loadedDataSourcesByFlight).forEach((dataSource) => {
    try {
      if (viewer.dataSources.contains(dataSource)) {
        viewer.dataSources.remove(dataSource, true)
      }
    } catch (err) {
      console.warn("Could not remove EFM data source:", err)
    }
  })

  efmRefs.loadedDataSourcesByFlight = {}
  efmRefs.loadedFlights = {}
  efmRefs.failedFlights = {}
  efmRefs.failedFlightUrls = {}

  if (viewer && !viewer.isDestroyed?.()) {
    viewer.trackedEntity = undefined
  }
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

async function loadFlightCzml(mode, flight, layer) {
  const urls = getFlightUrlCandidates(mode, flight, layer)
  let lastError = null

  for (const url of urls) {
    try {
      const result = await loadCzmlFromUrl(url)
      return result
    } catch (err) {
      lastError = err
      console.warn(`EFM CZML not available at ${url}`)
    }
  }

  const error = lastError || new Error(`Could not load ${flight.label} from any candidate URL`)
  error.triedUrls = urls
  throw error
}

function getSelectedFlightStartTime(selectedFlights) {
  let earliest = null
  selectedFlights.forEach((flight) => {
    if (!flight.start) return
    const start = JulianDate.fromIso8601(flight.start)
    if (!earliest || JulianDate.lessThan(start, earliest)) {
      earliest = start
    }
  })
  return earliest
}

export function applyEfmViewerClock(viewer, layer, efmRefs) {
  if (!viewer || viewer.isDestroyed?.() || !efmRefs) return

  const layerFlights = getLayerFlights(layer)
  const selectedFlights = layerFlights.filter((flight) => efmRefs.visibleFlights[flight.key])
  if (!selectedFlights.length) return

  const startTime =
    getSelectedFlightStartTime(selectedFlights) ||
    JulianDate.fromIso8601(layer.start || "2022-11-18T22:58:12Z")
  const stopTime = JulianDate.fromIso8601(layer.end || "2022-11-19T18:38:39.809000Z")

  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = stopTime.clone()
  viewer.clock.currentTime = startTime.clone()
  viewer.clock.multiplier = layer.clockMultiplier || 60
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, stopTime)
  }
}

async function loadEfmMode(viewer, layer, efmRefs) {
  const layerFlights = getLayerFlights(layer)
  const selectedFlights = layerFlights.filter((flight) => efmRefs.visibleFlights[flight.key])
  clearEfmDataSources(viewer, efmRefs)

  if (!selectedFlights.length) {
    emitEfmState(efmRefs)
    return null
  }

  const loadedSources = []

  for (const flight of selectedFlights) {
    try {
      const { dataSource, url } = await loadFlightCzml(efmRefs.currentMode, flight, layer)
      if (viewer.isDestroyed?.()) return null

      if (!efmRefs.resolvedBaseUrl && url) {
        const marker = `/${EFM_MODES[efmRefs.currentMode].folder}/`
        const idx = url.indexOf(marker)
        if (idx > 0) {
          efmRefs.resolvedBaseUrl = url.slice(0, idx)
        }
      }

      stabilizeEfmEntities(dataSource)
      viewer.dataSources.add(dataSource)
      efmRefs.loadedDataSourcesByFlight[flight.key] = dataSource
      efmRefs.loadedFlights[flight.key] = true
      loadedSources.push(dataSource)

      applyFlightOrientationFixIfNeeded(dataSource)
      applyLayerVisibilityToDataSource(dataSource, efmRefs.visibleLayers)
    } catch (err) {
      efmRefs.failedFlights[flight.key] = true
      efmRefs.failedFlightUrls[flight.key] = err.triedUrls || []
      console.warn(`Failed to load EFM flight ${flight.label}:`, err)
    }
  }

  emitEfmState(efmRefs)

  if (loadedSources.length) {
    applyEfmViewerClock(viewer, layer, efmRefs)
    flyCameraToEfmView(viewer, loadedSources, viewer.clock.currentTime)
    return loadedSources[0]
  }

  return null
}

function registerEfmEmitterHandlers(viewer, layer, efmRefs) {
  const onModeChange = async (mode) => {
    if (!EFM_MODES[mode]) return
    efmRefs.currentMode = mode
    const primary = await loadEfmMode(viewer, layer, efmRefs)
    efmRefs.cesiumLayerRef = primary
  }

  const onFlightChange = async (visibleFlights) => {
    efmRefs.visibleFlights = normalizeEfmVisibleFlights(
      visibleFlights,
      getLayerFlights(layer)
    )
    const primary = await loadEfmMode(viewer, layer, efmRefs)
    efmRefs.cesiumLayerRef = primary
  }

  const onLayerChange = (visibleLayers) => {
    efmRefs.visibleLayers = { ...visibleLayers }

    if (visibleLayers.dropLines && !efmRefs._dropLinesWereVisible) {
      flyToDropLineView(viewer, efmRefs.loadedDataSourcesByFlight, viewer.clock.currentTime)
      setTimeout(() => {
        Object.values(efmRefs.loadedDataSourcesByFlight).forEach((dataSource) => {
          applyLayerVisibilityToDataSource(dataSource, efmRefs.visibleLayers)
        })
        emitEfmState(efmRefs)
      }, 1600)
    } else {
      Object.values(efmRefs.loadedDataSourcesByFlight).forEach((dataSource) => {
        applyLayerVisibilityToDataSource(dataSource, efmRefs.visibleLayers)
      })
      emitEfmState(efmRefs)
    }

    efmRefs._dropLinesWereVisible = visibleLayers.dropLines
  }

  emitter.on("efmModeChange", onModeChange)
  emitter.on("efmFlightChange", onFlightChange)
  emitter.on("efmLayerChange", onLayerChange)

  efmRefs.emitterHandlers = { onModeChange, onFlightChange, onLayerChange }
}

function unregisterEfmEmitterHandlers(efmRefs) {
  if (!efmRefs?.emitterHandlers) return
  const { onModeChange, onFlightChange, onLayerChange } = efmRefs.emitterHandlers
  emitter.off("efmModeChange", onModeChange)
  emitter.off("efmFlightChange", onFlightChange)
  emitter.off("efmLayerChange", onLayerChange)
  efmRefs.emitterHandlers = null
}

export function unloadEfmLayer(viewer, efmRefs) {
  if (!efmRefs) return
  unregisterEfmEmitterHandlers(efmRefs)
  clearEfmDataSources(viewer, efmRefs)
  emitEfmState({
    currentMode: "altitude",
    flights: [],
    visibleFlights: {},
    visibleLayers: { ...DEFAULT_EFM_VISIBLE_LAYERS },
    loadedFlights: {},
    failedFlights: {},
    failedFlightUrls: {},
    resolvedBaseUrl: null,
    leeDataSubfolders: [],
  })
}

export function loadEfmLayer(viewer, layer) {
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)

  if (!layer?.efmBaseUrl && !leeEfmBaseUrls.length) {
    return Promise.reject(new Error("Missing EFM base URL"))
  }

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false

  const layerFlights = getLayerFlights(layer)
  const efmRefs = {
    currentMode: "altitude",
    flights: layerFlights,
    leeDataSubfolders: layer?.leeDataSubfolders || [],
    visibleFlights: getDefaultEfmVisibleFlights(layerFlights),
    visibleLayers: { ...DEFAULT_EFM_VISIBLE_LAYERS },
    loadedDataSourcesByFlight: {},
    loadedFlights: {},
    failedFlights: {},
    failedFlightUrls: {},
    resolvedBaseUrl: null,
    _dropLinesWereVisible: false,
    cesiumLayerRef: null,
  }

  registerEfmEmitterHandlers(viewer, layer, efmRefs)

  return loadEfmMode(viewer, layer, efmRefs).then((primary) => {
    if (!isLayerLoadActive(layerId, session)) {
      unloadEfmLayer(viewer, efmRefs)
      return null
    }

    efmRefs.cesiumLayerRef = primary
    return {
      cesiumLayerRef: primary,
      efmRefs,
    }
  })
}
