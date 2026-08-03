import {
  Cesium3DTileset,
  Cesium3DTileStyle,
  CzmlDataSource,
  JulianDate,
  ClockRange,
  Cartesian2,
  Cartesian3,
  HeadingPitchRange,
  Math as CesiumMath,
} from "cesium"
import emitter from "./event"
import { newFieldCampaignsBaseUrl, leeInstrumentIopPath } from "../config"
import { LEE_NOV18_FOLDER } from "../layers/lee-layers/components/instrumentLayers/helpers/leeIop2"
import { flyToLeeCamera, getLeeMultiInstrumentCamera } from "./leeCameraPolicy"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"
import { resolveLeeS3Url } from "./leeS3Url"
import {
  DOW7_DISPLAY_MODES,
  DEFAULT_DOW7_DISPLAY_MODE,
  DOW7_ACCUMULATE_WINDOW_SEC,
} from "./dow7Constants"

const DOW7_SCAN_URI_RE = /cfrad\.(\d{8})_(\d{6})(?:\.(\d+))?/i

function parseScanTimeMs(uri) {
  const match = String(uri || "").match(DOW7_SCAN_URI_RE)
  if (!match) return null

  const [, ymd, hms, frac = "0"] = match
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hms.slice(0, 2)}:${hms.slice(2, 4)}:${hms.slice(4, 6)}.${frac}Z`
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? ms : null
}

function getTileContentUri(tile) {
  return (
    tile?.content?.uri ||
    tile?.content?._resource?.url ||
    tile?._header?.content?.uri ||
    tile?._contentHeader?.uri ||
    null
  )
}

function isScanVisibleInAccumulateWindow(
  scanMs,
  viewerTime,
  windowSec = DOW7_ACCUMULATE_WINDOW_SEC
) {
  const viewerMs = JulianDate.toDate(viewerTime).getTime()
  const windowStartMs = viewerMs - windowSec * 1000
  return scanMs >= windowStartMs && scanMs <= viewerMs
}

function applyDow7TileTemporalShow(tile, dow7Refs, viewerTime) {
  if (!tile?.content) return

  const mode = dow7Refs?.dow7Prefs?.displayMode || DEFAULT_DOW7_DISPLAY_MODE
  if (mode === DOW7_DISPLAY_MODES.full.key) {
    tile.content.show = true
    return
  }

  const scanMs = parseScanTimeMs(getTileContentUri(tile))
  if (!scanMs) {
    tile.content.show = true
    return
  }

  tile.content.show = isScanVisibleInAccumulateWindow(scanMs, viewerTime)
}

function registerDow7TemporalTiles(viewer, tileset, dow7Refs) {
  if (!viewer || !tileset || tileset._dow7TemporalRegistered) return

  tileset._dow7TemporalRegistered = true
  if (!dow7Refs.loadedTilesByTileset) {
    dow7Refs.loadedTilesByTileset = new Map()
  }

  const loadedTiles = new Set()
  dow7Refs.loadedTilesByTileset.set(tileset, loadedTiles)

  const onLoad = (tile) => {
    loadedTiles.add(tile)
    applyDow7TileTemporalShow(tile, dow7Refs, viewer.clock.currentTime)
    safeRequestRender(viewer)
  }

  const onUnload = (tile) => {
    loadedTiles.delete(tile)
  }

  tileset.tileLoad.addEventListener(onLoad)
  tileset.tileUnload.addEventListener(onUnload)
  tileset._dow7TemporalHandlers = { onLoad, onUnload }
}

function unregisterDow7TemporalTiles(tileset) {
  if (!tileset?._dow7TemporalHandlers) return

  tileset.tileLoad.removeEventListener(tileset._dow7TemporalHandlers.onLoad)
  tileset.tileUnload.removeEventListener(tileset._dow7TemporalHandlers.onUnload)
  delete tileset._dow7TemporalHandlers
  delete tileset._dow7TemporalRegistered
}

export function syncDow7TemporalAtViewerTime(viewer, dow7Refs) {
  if (!viewer || viewer.isDestroyed?.() || !dow7Refs) return

  const viewerTime = viewer.clock.currentTime
  const tilesets = [
    dow7Refs.highDbzTileset,
    dow7Refs.getLowTileset?.(),
    dow7Refs.lowDbzTileset,
  ].filter(Boolean)

  tilesets.forEach((tileset) => {
    const loadedTiles = dow7Refs.loadedTilesByTileset?.get(tileset)
    if (!loadedTiles?.size) return
    loadedTiles.forEach((tile) => {
      applyDow7TileTemporalShow(tile, dow7Refs, viewerTime)
    })
  })

  safeRequestRender(viewer)
}

function unregisterDow7ClockTick(viewer, dow7Refs) {
  if (!viewer || viewer.isDestroyed?.() || !dow7Refs?.clockTickHandler) return
  viewer.clock.onTick.removeEventListener(dow7Refs.clockTickHandler)
  dow7Refs.clockTickHandler = null
}

function registerDow7ClockTick(viewer, dow7Refs) {
  if (!viewer || viewer.isDestroyed?.() || dow7Refs?.useSharedLeeClock) return
  unregisterDow7ClockTick(viewer, dow7Refs)

  dow7Refs.clockTickHandler = viewer.clock.onTick.addEventListener(() => {
    if (viewer.isDestroyed?.()) return
    syncDow7TemporalAtViewerTime(viewer, dow7Refs)
  })
}

function emitDow7DisplayModeState(dow7Refs) {
  emitter.emit("dow7DisplayModeState", dow7Refs?.dow7Prefs?.displayMode || DEFAULT_DOW7_DISPLAY_MODE)
}

const DOW7_CENTER_LON = -76.026593
const DOW7_CENTER_LAT = 43.990895
const DOW7_CENTER_ALT = 95.0
const DOW7_RADIUS = 62427
const DOW7_REGIONAL_CAMERA_HEIGHT = 80000
const DOW7_OVERVIEW_CAMERA_HEIGHT = 200000
const DOW7_CAMERA_UPDATE_MIN_HEIGHT_DELTA = 15000
const DOW7_SSE_RAMP_MS = [600, 2200, 5000, 9000]
const DOW7_SSE_RAMP_VALUES = [0.3, 0.2, 0.12, 0.05]

function getDowSseTier(cameraHeight = 0) {
  if (cameraHeight >= 500000) return 3
  if (cameraHeight >= DOW7_OVERVIEW_CAMERA_HEIGHT) return 2
  if (cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT) return 1
  return 0
}

function throttle(fn, waitMs) {
  let lastCall = 0
  let timeoutId = null
  return function throttled(...args) {
    const now = Date.now()
    const remaining = waitMs - (now - lastCall)
    if (remaining <= 0) {
      lastCall = now
      fn.apply(this, args)
      return
    }
    if (timeoutId) return
    timeoutId = setTimeout(() => {
      timeoutId = null
      lastCall = Date.now()
      fn.apply(this, args)
    }, remaining)
  }
}

function isRegionalDow7Camera(cameraHeight, visibilityBoost = false) {
  return visibilityBoost || cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT
}

function canViewerRender(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return false
  const canvas = viewer.canvas
  if (!canvas) return false
  if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) return false

  try {
    const context = viewer.scene?.context
    if (
      context &&
      (context.drawingBufferWidth <= 0 || context.drawingBufferHeight <= 0)
    ) {
      return false
    }
  } catch {
    return false
  }

  return true
}

function ensureViewerSized(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return false
  try {
    viewer.resize()
  } catch {
    // ignore resize errors while the dock layout is settling
  }
  return canViewerRender(viewer)
}

function waitForViewerReady(viewer, timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!viewer || viewer.isDestroyed?.()) {
      resolve(false)
      return
    }

    const started = Date.now()
    const tick = () => {
      if (ensureViewerSized(viewer)) {
        resolve(true)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false)
        return
      }
      requestAnimationFrame(tick)
    }

    tick()
  })
}

function withDow7RenderMode(viewer, fn) {
  if (!viewer || viewer.isDestroyed?.()) return fn()

  const scene = viewer.scene
  const previousRequestRenderMode = scene.requestRenderMode
  const previousMaximumRenderTimeChange = scene.maximumRenderTimeChange
  const previousShouldAnimate = viewer.clock.shouldAnimate

  scene.requestRenderMode = true
  scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY
  viewer.clock.shouldAnimate = false

  const finish = () => {
    if (viewer.isDestroyed?.()) return
    scene.requestRenderMode = previousRequestRenderMode
    scene.maximumRenderTimeChange = previousMaximumRenderTimeChange
    viewer.clock.shouldAnimate = previousShouldAnimate
    safeRequestRender(viewer)
  }

  let result
  try {
    result = fn()
  } catch (err) {
    finish()
    throw err
  }

  if (result && typeof result.then === "function") {
    return result.finally(finish)
  }

  finish()
  return result
}

function safeRequestRender(viewer) {
  if (!ensureViewerSized(viewer)) return
  viewer.scene.requestRender()
}

function getDowPointSize(cameraHeight, visibilityBoost = false) {
  let size
  if (cameraHeight > 800000) size = 16.0
  else if (cameraHeight > 500000) size = 14.0
  else if (cameraHeight > 300000) size = 12.0
  else if (cameraHeight > 180000) size = 10.0
  else if (cameraHeight > 100000) size = 8.0
  else size = 6.0

  if (visibilityBoost || cameraHeight >= DOW7_OVERVIEW_CAMERA_HEIGHT) {
    return Math.min(Math.round(size * 2), 24)
  }
  if (cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT) {
    return Math.min(Math.round(size * 1.5), 20)
  }
  return size
}

const DOW7_MAX_POINT_SIZE = 24

function getDow7TileUrlCandidates(layer, level) {
  const iopFolder = layer?.leeDataSubfolders?.[0] || LEE_NOV18_FOLDER
  const listKey = level === "high" ? "highTileUrls" : "lowTileUrls"
  const fromLayer = layer?.[listKey]

  const urls = []
  const seen = new Set()
  const add = (url) => {
    if (url && !seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  if (newFieldCampaignsBaseUrl) {
    add(
      `${newFieldCampaignsBaseUrl}/Lee/instrument-processed-data/Mobile_radar/${iopFolder}/${level}/tileset.json`
    )
  }

  const primary = level === "high" ? layer?.highTileLocation : layer?.lowTileLocation
  add(primary)
  fromLayer?.forEach(add)

  add(leeInstrumentIopPath("Mobile_radar", iopFolder, level, "tileset.json"))

  const legacyLevel = level === "high" ? "dow7_3dtiles_high" : "dow7_3dtiles_low"
  add(leeInstrumentIopPath("Mobile_radar", legacyLevel, "tileset.json"))

  return urls
}

function getDow7SurfaceCzmlCandidates(layer) {
  if (layer?.surfaceCzmlUrls?.length) return layer.surfaceCzmlUrls
  return [layer?.surfaceCzmlLocation].filter(Boolean)
}

function getDowMaximumScreenSpaceError(cameraHeight = 0) {
  // Root tileset node has no geometry — only leaf .pnts do. At ~560 km the
  // projected root SSE is ~0.48, so a threshold of 1 never refines to leaves.
  if (cameraHeight >= 500000) return 0.05
  if (cameraHeight >= DOW7_OVERVIEW_CAMERA_HEIGHT) return 0.1
  if (cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT) return 0.2
  return 1
}

function getDowTilesetOptions(cameraHeight = 500000) {
  return {
    // Start conservative — ramp down after the UI has painted.
    maximumScreenSpaceError: 0.3,
    dynamicScreenSpaceError: false,
    skipLevelOfDetail: true,
    baseScreenSpaceError: 768,
    skipScreenSpaceErrorFactor: 24,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cullWithChildrenBounds: true,
    cullRequestsWhileMoving: true,
    preloadWhenHidden: false,
    preferLeaves: true,
    maximumMemoryUsage: 256,
  }
}

function applyDowTilesetLoadingPolicy(tileset, cameraHeight = 0) {
  if (!tileset) return
  tileset.show = true
  tileset.maximumScreenSpaceError = getDowMaximumScreenSpaceError(cameraHeight)
  tileset.dynamicScreenSpaceError = false
  tileset.foveatedScreenSpaceError = false
  tileset.skipLevelOfDetail = true
  tileset.preferLeaves = true
  tileset.immediatelyLoadDesiredLevelOfDetail = false
  tileset.loadSiblings = false
  tileset.cullWithChildrenBounds = true
  tileset.cullRequestsWhileMoving = true
  tileset.maximumMemoryUsage = 256
  if (tileset.pointCloudShading) {
    tileset.pointCloudShading.attenuation = false
    tileset.pointCloudShading.eyeDomeLighting = false
  }
}

function clearDow7RefinementSchedule(tileset) {
  if (!tileset?._dow7RefineTimers) return
  tileset._dow7RefineTimers.forEach((timerId) => clearTimeout(timerId))
  tileset._dow7RefineTimers = null
}

function scheduleDow7Refinement(viewer, tileset) {
  if (!viewer || !tileset || viewer.isDestroyed?.()) return

  clearDow7RefinementSchedule(tileset)
  tileset._dow7RefineTimers = DOW7_SSE_RAMP_MS.map((delayMs, index) =>
    setTimeout(() => {
      if (viewer.isDestroyed?.() || !tileset) return
      tileset.maximumScreenSpaceError = DOW7_SSE_RAMP_VALUES[index]
      safeRequestRender(viewer)
    }, delayMs)
  )
}

function configureDowTileset(tileset, cameraHeight = 0) {
  applyDowTilesetLoadingPolicy(tileset, cameraHeight)
}

function applyPointCloudStyle(tilesets, pointSize) {
  const safePointSize = Math.min(Math.max(pointSize, 4), DOW7_MAX_POINT_SIZE)
  const style = new Cesium3DTileStyle({
    pointSize: safePointSize,
  })

  tilesets.forEach((tileset) => {
    if (tileset) tileset.style = style
  })
}

function attachDow7TilesetRenderLoop(viewer, tileset) {
  if (!viewer || !tileset || tileset._dow7RenderAttached) return
  tileset._dow7RenderAttached = true

  const requestRender = throttle(() => safeRequestRender(viewer), 250)

  if (tileset.initialTilesLoaded) {
    tileset.initialTilesLoaded.addEventListener(requestRender)
  } else if (tileset.tileLoad) {
    tileset.tileLoad.addEventListener(requestRender)
  }

  requestRender()
}

function applyDow7Visibility(
  viewer,
  highTileset,
  lowTileset,
  { cameraHeight, visibilityBoost = false, lowDbzVisible = false, visState } = {}
) {
  if (!viewer || viewer.isDestroyed?.()) return

  const regionalView = isRegionalDow7Camera(cameraHeight, visibilityBoost)
  const overviewView = cameraHeight >= DOW7_OVERVIEW_CAMERA_HEIGHT
  const pointSize = getDowPointSize(cameraHeight, visibilityBoost)
  const lowShow = lowDbzVisible === true && !!lowTileset

  if (visState) {
    const heightDelta = Math.abs(cameraHeight - (visState.lastCameraHeight ?? -1))
    const sseTier = getDowSseTier(cameraHeight)
    if (
      visState.lastPointSize === pointSize &&
      visState.lastRegionalView === regionalView &&
      visState.lastOverviewView === overviewView &&
      visState.lastLowShow === lowShow &&
      visState.lastSseTier === sseTier &&
      heightDelta < DOW7_CAMERA_UPDATE_MIN_HEIGHT_DELTA
    ) {
      return
    }
    visState.lastCameraHeight = cameraHeight
    visState.lastPointSize = pointSize
    visState.lastRegionalView = regionalView
    visState.lastOverviewView = overviewView
    visState.lastLowShow = lowShow
    visState.lastSseTier = sseTier
  }

  raiseDowTilesets(viewer, highTileset, lowTileset)
  if (highTileset) {
    highTileset.show = true
    if (!visState || visState.lastConfiguredSseTier !== visState.lastSseTier) {
      applyDowTilesetLoadingPolicy(highTileset, cameraHeight)
      if (visState) visState.lastConfiguredSseTier = visState.lastSseTier
    }
  }
  if (lowTileset) {
    lowTileset.show = lowShow
    if (lowShow && (!visState || visState.lastConfiguredLowSseTier !== visState.lastSseTier)) {
      applyDowTilesetLoadingPolicy(lowTileset, cameraHeight)
      if (visState) visState.lastConfiguredLowSseTier = visState.lastSseTier
    }
  }

  if (!visState || visState.lastAppliedPointSize !== pointSize) {
    applyPointCloudStyle([highTileset, lowTileset].filter(Boolean), pointSize)
    if (visState) visState.lastAppliedPointSize = pointSize
  }

  safeRequestRender(viewer)
}

function getProgressiveTilesetOptions(viewer) {
  const cameraHeight = viewer?.camera?.positionCartographic?.height ?? 500000
  return getDowTilesetOptions(cameraHeight)
}

function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 32 })
      return
    }
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      return
    }
    setTimeout(resolve, 16)
  })
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

/** Oblique view over the DOW7 site — used before tiles finish loading. */
export function flyToDow7InitialView(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return

  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(DOW7_CENTER_LON, DOW7_CENTER_LAT, 38000),
    orientation: {
      heading: CesiumMath.toRadians(12),
      pitch: CesiumMath.toRadians(-52),
      roll: 0,
    },
  })
  safeRequestRender(viewer)
}

/** Frame loaded DOW7 tiles — regional keeps other LEE layers roughly in context. */
export function flyToDow7View(viewer, tileset, options = {}) {
  if (!viewer || viewer.isDestroyed?.() || !tileset) return

  const sphere = tileset.boundingSphere
  if (!sphere) return

  const regional = options.regional === true
  const range = regional
    ? Math.max(sphere.radius * 2.4, 48000)
    : Math.max(sphere.radius * 1.7, 30000)
  const offset = new HeadingPitchRange(
    CesiumMath.toRadians(regional ? 12 : 0),
    CesiumMath.toRadians(regional ? -50 : -58),
    range
  )

  if (options.instant) {
    viewer.camera.viewBoundingSphere(sphere, offset)
    safeRequestRender(viewer)
    return
  }

  viewer.camera.flyToBoundingSphere(sphere, {
    offset,
    duration: options.duration ?? 1.2,
  })
}

function raiseDowTilesets(viewer, ...tilesets) {
  if (!viewer?.scene?.primitives) return
  tilesets.filter(Boolean).forEach((tileset) => {
    try {
      viewer.scene.primitives.raiseToTop(tileset)
    } catch {
      // ignore ordering errors
    }
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
  const errors = []

  for (const rawUrl of candidates) {
    const url = resolveLeeS3Url(rawUrl)
    let tileset = null
    try {
      tileset = new Cesium3DTileset({
        url,
        ...tilesetOptions,
      })
      viewer.scene.primitives.add(tileset)
      await yieldToBrowser()
      await tileset.readyPromise
      const cameraHeight = viewer.camera.positionCartographic.height
      applyDowTilesetLoadingPolicy(tileset, cameraHeight)
      attachDow7TilesetRenderLoop(viewer, tileset)
      scheduleDow7Refinement(viewer, tileset)
      safeRequestRender(viewer)

      console.log(`Loaded DOW7 ${level} tileset: ${url}`)
      return { tileset, url }
    } catch (err) {
      const detail = err?.message || String(err)
      errors.push(`${url}: ${detail}`)
      console.warn(`DOW7 ${level} tileset failed at ${url}`, err)
      if (tileset && viewer?.scene?.primitives) {
        try {
          viewer.scene.primitives.remove(tileset)
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  if (required) {
    throw new Error(
      `Could not load DOW7 ${level} tileset. Tried: ${candidates.join(", ")}${
        errors.length ? `. Errors: ${errors.join(" | ")}` : ""
      }`
    )
  }

  return { tileset: null, url: null }
}

export function applyDow7ViewerClock(viewer, layer) {
  if (!viewer || viewer.isDestroyed?.()) return

  const startTime = JulianDate.fromIso8601(layer?.start || "2022-11-18T18:58:16Z")
  const endTime = JulianDate.fromIso8601(layer?.end || "2022-11-19T06:02:54Z")

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = endTime.clone()
  if (JulianDate.lessThan(viewer.clock.currentTime, startTime)) {
    viewer.clock.currentTime = startTime.clone()
  } else if (JulianDate.greaterThan(viewer.clock.currentTime, endTime)) {
    viewer.clock.currentTime = startTime.clone()
  }
  viewer.clock.multiplier = layer?.clockMultiplier || 60
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, endTime)
  }
}

export function syncDow7AtViewerTime(viewer, entry, activeEntries, active) {
  if (!viewer || viewer.isDestroyed?.() || !entry?.dow7Refs) return

  const { highDbzTileset, lowDbzTileset, getLowTileset, dow7Prefs } = entry.dow7Refs
  const lowTileset = getLowTileset?.() || lowDbzTileset

  if (!active) {
    if (highDbzTileset) highDbzTileset.show = false
    if (lowTileset) lowTileset.show = false
    if (entry.dow7Refs.surfaceObs) entry.dow7Refs.surfaceObs.show = false
    return
  }

  if (entry.dow7Refs.surfaceObs) entry.dow7Refs.surfaceObs.show = true
  syncDow7MultiLayerVisibility(viewer, activeEntries)
  if (lowTileset) {
    lowTileset.show = dow7Prefs?.lowDbzVisible === true
  }
  syncDow7TemporalAtViewerTime(viewer, entry.dow7Refs)
}

/** Keep DOW7 visible when other LEE primitives/imagery load on top. */
export function syncDow7MultiLayerVisibility(viewer, activeEntries, options = {}) {
  if (!viewer || viewer.isDestroyed?.()) return false

  const dow7Entry = (activeEntries || []).find(
    (entry) => entry?.layer?.displayMechanism === "dow7" && entry?.dow7Refs?.highDbzTileset
  )
  if (!dow7Entry?.dow7Refs) return false

  const multiLayer = (activeEntries || []).length > 1
  const { highDbzTileset, lowDbzTileset, dow7Prefs, getLowTileset } = dow7Entry.dow7Refs
  const cameraHeight = viewer.camera.positionCartographic.height
  const overviewView = cameraHeight >= DOW7_OVERVIEW_CAMERA_HEIGHT
  const boost = multiLayer || overviewView || cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT

  applyDow7Visibility(viewer, highDbzTileset, getLowTileset?.() ?? lowDbzTileset, {
    cameraHeight,
    visibilityBoost: boost,
    lowDbzVisible: dow7Prefs?.lowDbzVisible === true,
    visState: { lastCameraHeight: -1 },
  })

  if (options.flyToView) {
    if (multiLayer || overviewView) {
      flyToLeeCamera(viewer, getLeeMultiInstrumentCamera(activeEntries))
    } else {
      flyToDow7View(viewer, highDbzTileset, { regional: true, instant: true })
    }
  }

  return true
}

export function unloadDow7Layer(viewer, dow7Refs) {
  if (!dow7Refs) return

  if (dow7Refs.homeShortcutHandler) {
    window.removeEventListener("keydown", dow7Refs.homeShortcutHandler)
  }

  if (dow7Refs.cameraChangedHandler && viewer?.camera?.changed) {
    try {
      viewer.camera.changed.removeEventListener(dow7Refs.cameraChangedHandler)
    } catch (err) {
      console.warn("Could not remove DOW7 camera handler:", err)
    }
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
  emitter.emit("dow7DisplayModeState", DEFAULT_DOW7_DISPLAY_MODE)

  unregisterDow7ClockTick(viewer, dow7Refs)

  if (dow7Refs.displayModeChangeHandler) {
    emitter.off("dow7DisplayModeChange", dow7Refs.displayModeChangeHandler)
  }

  if (dow7Refs.lowDbzChangeHandler) {
    emitter.off("dow7LowDbzChange", dow7Refs.lowDbzChangeHandler)
  }

  const viewerDestroyed = viewer?.isDestroyed?.()

  if (!viewerDestroyed && viewer?.scene?.primitives) {
    const lowTileset = dow7Refs.lowDbzTileset || dow7Refs.getLowTileset?.()
    ;[dow7Refs.highDbzTileset, lowTileset].forEach((tileset) => {
      if (!tileset) return
      unregisterDow7TemporalTiles(tileset)
      clearDow7RefinementSchedule(tileset)
      try {
        viewer.scene.primitives.remove(tileset)
      } catch (err) {
        console.warn("Could not remove DOW7 tileset:", err)
      }
    })
  }

  if (!viewerDestroyed && dow7Refs.surfaceObs) {
    try {
      viewer.dataSources.remove(dow7Refs.surfaceObs, true)
    } catch (err) {
      console.warn("Could not remove DOW7 surface observations:", err)
    }
    dow7Refs.surfaceObs = null
  }

  // Orphan surface CZML can remain if it finished loading after unload.
  if (!viewerDestroyed && viewer?.dataSources) {
    const toRemove = []
    for (let i = 0; i < viewer.dataSources.length; i++) {
      const dataSource = viewer.dataSources.get(i)
      if (dataSource?.entities?.getById?.("dow7_surface_obs")) {
        toRemove.push(dataSource)
      }
    }
    toRemove.forEach((dataSource) => {
      try {
        viewer.dataSources.remove(dataSource, true)
      } catch (err) {
        console.warn("Could not remove orphaned DOW7 surface observations:", err)
      }
    })
  }

  if (dow7Refs.surfaceObsIdleHandle != null) {
    if (typeof cancelIdleCallback === "function") {
      try {
        cancelIdleCallback(dow7Refs.surfaceObsIdleHandle)
      } catch {
        // ignore
      }
    }
    dow7Refs.surfaceObsIdleHandle = null
  }
  if (dow7Refs.surfaceObsTimeoutHandle != null) {
    clearTimeout(dow7Refs.surfaceObsTimeoutHandle)
    dow7Refs.surfaceObsTimeoutHandle = null
  }
}

export function loadDow7Layer(viewer, layer, options = {}) {
  if (!viewer || viewer.isDestroyed?.()) {
    return Promise.resolve(null)
  }

  return waitForViewerReady(viewer).then((ready) => {
    if (!ready || viewer.isDestroyed?.()) {
      console.warn("DOW7 load skipped: Cesium canvas is not ready to render.")
      return null
    }

    return withDow7RenderMode(viewer, () => loadDow7LayerInternal(viewer, layer, options))
  })
}

function loadDow7LayerInternal(viewer, layer, options = {}) {
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)
  const { flyOnLoad = true, visibilityBoost = false, skipViewerClock = false } = options

  const centerInfo = layer.center || {
    lon: DOW7_CENTER_LON,
    lat: DOW7_CENTER_LAT,
    alt: DOW7_CENTER_ALT,
    radius: DOW7_RADIUS,
  }

  const tilesetOptions = getProgressiveTilesetOptions(viewer)

  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.fog.enabled = false
  viewer.scene.globe.enableLighting = false
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false

  if (!options.skipViewerClock) {
    applyDow7ViewerClock(viewer, layer)
  }

  return loadTilesetFromCandidates(viewer, layer, "high", tilesetOptions, true)
    .then(async ({ tileset: highTileset }) => {
      await yieldToBrowser()

      let lowTileset = null
      let lowTilesetLoading = false
      const dow7Prefs = {
        lowDbzVisible: false,
        displayMode: DEFAULT_DOW7_DISPLAY_MODE,
      }
      const visState = {}
      const dow7Refs = {
        highDbzTileset: highTileset,
        lowDbzTileset: null,
        getLowTileset: () => lowTileset,
        dow7Prefs,
        loadedTilesByTileset: new Map(),
        useSharedLeeClock: skipViewerClock === true,
        surfaceObs: null,
        surfaceObsIdleHandle: null,
        surfaceObsTimeoutHandle: null,
        layerId,
        loadSession: session,
      }

      registerDow7TemporalTiles(viewer, highTileset, dow7Refs)
      registerDow7ClockTick(viewer, dow7Refs)
      syncDow7TemporalAtViewerTime(viewer, dow7Refs)

      const displayModeChangeHandler = (mode) => {
        if (!DOW7_DISPLAY_MODES[mode]) return
        dow7Prefs.displayMode = mode
        emitDow7DisplayModeState(dow7Refs)
        syncDow7TemporalAtViewerTime(viewer, dow7Refs)
      }
      emitter.on("dow7DisplayModeChange", displayModeChangeHandler)
      emitDow7DisplayModeState(dow7Refs)

      const refreshVisibility = (lowDbzVisible = dow7Prefs.lowDbzVisible) => {
        const cameraHeight = viewer.camera.positionCartographic.height
        const boost = visibilityBoost || cameraHeight >= DOW7_REGIONAL_CAMERA_HEIGHT

        applyDow7Visibility(viewer, highTileset, lowTileset, {
          cameraHeight,
          visibilityBoost: boost,
          lowDbzVisible: lowDbzVisible === true,
          visState,
        })
      }

      const cameraChangedHandler = throttle(() => {
        if (viewer.isDestroyed?.()) return
        refreshVisibility()
      }, 250)

      viewer.camera.changed.addEventListener(cameraChangedHandler)

      const loadLowTilesetIfNeeded = async () => {
        if (lowTileset || lowTilesetLoading || viewer.isDestroyed?.()) return lowTileset
        if (!isLayerLoadActive(layerId, session)) return null

        lowTilesetLoading = true
        try {
          await yieldToBrowser()
          const { tileset } = await loadTilesetFromCandidates(
            viewer,
            layer,
            "low",
            tilesetOptions,
            false
          )
          if (!tileset || viewer.isDestroyed?.() || !isLayerLoadActive(layerId, session)) {
            if (tileset && viewer?.scene?.primitives) {
              try {
                viewer.scene.primitives.remove(tileset)
              } catch {
                // ignore cleanup errors
              }
            }
            return null
          }
          lowTileset = tileset
          attachDow7TilesetRenderLoop(viewer, lowTileset)
          scheduleDow7Refinement(viewer, lowTileset)
          registerDow7TemporalTiles(viewer, lowTileset, dow7Refs)
          syncDow7TemporalAtViewerTime(viewer, dow7Refs)
          return lowTileset
        } catch (err) {
          console.warn("DOW7 low tileset load failed:", err)
          return null
        } finally {
          lowTilesetLoading = false
        }
      }

      const setLowDbzVisible = async (visible) => {
        dow7Prefs.lowDbzVisible = !!visible
        emitter.emit("dow7LowDbzState", dow7Prefs.lowDbzVisible)

        if (dow7Prefs.lowDbzVisible) {
          await loadLowTilesetIfNeeded()
        } else if (lowTileset) {
          lowTileset.show = false
        }

        visState.lastCameraHeight = -1
        refreshVisibility(dow7Prefs.lowDbzVisible)
      }

      const lowDbzChangeHandler = (visible) => setLowDbzVisible(visible)
      emitter.on("dow7LowDbzChange", lowDbzChangeHandler)
      emitter.emit("dow7LowDbzState", false)
      refreshVisibility(false)

      const homeShortcutHandler = (event) => {
        if (event.key === "h" || event.key === "H") {
          flyToDowCenter(viewer, centerInfo)
        }
        if (event.key === "o" || event.key === "O") {
          flyToDowCenter(viewer, centerInfo)
        }
        if (event.key === "d" || event.key === "D") {
          setLowDbzVisible(!dow7Prefs.lowDbzVisible)
        }
      }

      window.addEventListener("keydown", homeShortcutHandler)

      dow7Refs.cameraChangedHandler = cameraChangedHandler
      dow7Refs.homeShortcutHandler = homeShortcutHandler
      dow7Refs.lowDbzChangeHandler = lowDbzChangeHandler
      dow7Refs.displayModeChangeHandler = displayModeChangeHandler

      return {
        highTileset,
        lowTileset,
        cameraChangedHandler,
        homeShortcutHandler,
        lowDbzChangeHandler,
        displayModeChangeHandler,
        dow7Prefs,
        dow7Refs,
        getLowTileset: () => lowTileset,
      }
    })
    .then(async ({
      highTileset,
      cameraChangedHandler,
      homeShortcutHandler,
      lowDbzChangeHandler,
      displayModeChangeHandler,
      dow7Prefs,
      dow7Refs,
      getLowTileset,
    }) => {
      if (viewer.isDestroyed?.()) return null

      try {
        if (flyOnLoad && ensureViewerSized(viewer)) {
          flyToLeeCamera(viewer, getLeeMultiInstrumentCamera([{ layer }]))
        }
      } catch {
        if (flyOnLoad && ensureViewerSized(viewer)) {
          flyToDowCenter(viewer, centerInfo)
        }
      }

      await yieldToBrowser()

      const refreshAfterCamera = () => {
        if (viewer.isDestroyed?.()) return
        const cameraHeight = viewer.camera.positionCartographic.height
        applyDow7Visibility(viewer, highTileset, getLowTileset?.(), {
          cameraHeight,
          visibilityBoost: true,
          lowDbzVisible: dow7Prefs?.lowDbzVisible === true,
          visState: { lastCameraHeight: -1 },
        })
        safeRequestRender(viewer)
      }

      refreshAfterCamera()
      if (flyOnLoad) {
        setTimeout(refreshAfterCamera, 2200)
      }

      await yieldToBrowser()

      let surfaceDs = null
      const loadSurfaceObs = async () => {
        if (!isLayerLoadActive(layerId, session) || viewer.isDestroyed?.()) return

        const surfaceCandidates = getDow7SurfaceCzmlCandidates(layer)
        for (const surfaceUrl of surfaceCandidates) {
          if (!isLayerLoadActive(layerId, session) || viewer.isDestroyed?.()) return
          const resolvedSurfaceUrl = resolveLeeS3Url(surfaceUrl)
          try {
            surfaceDs = await CzmlDataSource.load(resolvedSurfaceUrl)
            console.log(`Loaded DOW7 surface observations: ${resolvedSurfaceUrl}`)
            break
          } catch (err) {
            console.warn(`DOW7 surface observations failed at ${surfaceUrl}`, err)
          }
        }

        if (!surfaceDs) return
        if (!isLayerLoadActive(layerId, session) || viewer.isDestroyed?.()) {
          // Layer was turned off while CZML was loading — don't leave the label behind.
          return
        }

        try {
          viewer.dataSources.add(surfaceDs)
          dow7Refs.surfaceObs = surfaceDs

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
        } catch (err) {
          console.warn("DOW7 surface observations not loaded (optional):", err)
          return
        }

        if (!isLayerLoadActive(layerId, session)) {
          try {
            viewer.dataSources.remove(surfaceDs, true)
          } catch {
            // ignore
          }
          dow7Refs.surfaceObs = null
          return
        }

        if (!skipViewerClock) {
          applyDow7ViewerClock(viewer, layer)
        } else {
          syncDow7TemporalAtViewerTime(viewer, dow7Refs)
        }
        safeRequestRender(viewer)
      }

      if (typeof requestIdleCallback === "function") {
        dow7Refs.surfaceObsIdleHandle = requestIdleCallback(() => loadSurfaceObs(), {
          timeout: 2500,
        })
      } else {
        dow7Refs.surfaceObsTimeoutHandle = setTimeout(loadSurfaceObs, 1500)
      }

      const lowTileset = getLowTileset?.()

      if (visibilityBoost) {
        dow7Refs.lowDbzTileset = lowTileset
        syncDow7MultiLayerVisibility(viewer, [{ layer, dow7Refs }])
      }

      return {
        cesiumLayerRef: highTileset,
        dow7Refs,
      }
    })
}
