import {
  JulianDate,
  ClockRange,
  Rectangle,
  SingleTileImageryProvider,
  UrlTemplateImageryProvider,
  Cartographic,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Math as CesiumMath,
} from "cesium"
import emitter from "./event"
import { leeNexradFramesPath } from "../config"
import { cancelLayerLoad, getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

const LEGACY_FRAME_PREFIXES = ["radar_frames_mode/", "radar_tiles/"]
const FRAME_FILE_PATTERN = /frame_\d+\.png$/i

let nexradSessionGeneration = 0
const pendingNexradLoads = new Map()

function isNexradLoadStillActive(nexradRefs) {
  if (!nexradRefs) return false
  if (nexradRefs.sessionId !== nexradSessionGeneration) return false
  return isLayerLoadActive(nexradRefs.layerId, nexradRefs.loadSession)
}

export function abortNexradLayerLoad(layerId, viewer) {
  if (!layerId) return
  cancelLayerLoad(layerId)

  const pending = pendingNexradLoads.get(layerId)
  if (pending) {
    unloadNexradLayer(pending.viewer || viewer, pending.nexradRefs)
    pendingNexradLoads.delete(layerId)
  }
}

function addFramesUrlVariant(urls, url) {
  if (!url) return
  const trimmed = url.replace(/\/$/, "")
  urls.add(trimmed)
  if (trimmed.includes("/Lee/")) {
    urls.add(trimmed.replace("/Lee/", "/LEE/"))
  }
  if (trimmed.includes("/LEE/")) {
    urls.add(trimmed.replace("/LEE/", "/Lee/"))
  }
}

function getFramesJsonCandidates(layer) {
  const iopFolder = layer?.leeDataSubfolders?.[0]
  if (iopFolder) {
    const strictUrl = leeNexradFramesPath(iopFolder)
    return strictUrl ? [strictUrl] : []
  }

  const urls = new Set()
  addFramesUrlVariant(urls, layer?.framesJsonUrl)
  return [...urls]
}

function validateFramesForLayer(layer, frames, url, payload) {
  const iopFolder = layer?.leeDataSubfolders?.[0]

  if (iopFolder && url && !url.includes(`/${iopFolder}/`)) {
    throw new Error(`frames.json URL does not match IOP folder ${iopFolder}: ${url}`)
  }

  const dateLabel = payload?.metadata?.date_label
  if (iopFolder && dateLabel && dateLabel !== iopFolder) {
    throw new Error(
      `frames.json metadata.date_label is ${dateLabel}, expected ${iopFolder}. ` +
        `Re-upload frames.json from the ${iopFolder} pipeline output to ${url}`
    )
  }

  if (iopFolder && frames[0]?.image) {
    const imagePath = String(frames[0].image)
    if (imagePath.includes("/Nov18/") && iopFolder === "Nov19") {
      throw new Error(
        `frames.json image paths reference Nov18 but URL is ${iopFolder}. ` +
          `Upload the Nov19 frames.json to ${url}`
      )
    }
    if (imagePath.includes("/Nov19/") && iopFolder === "Nov18") {
      throw new Error(
        `frames.json image paths reference Nov19 but URL is ${iopFolder}. ` +
          `Upload the Nov18 frames.json to ${url}`
      )
    }
  }
}

function resolveFrameAssetUrl(framesJsonUrl, assetUrl) {
  if (!assetUrl) return null
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl

  const framesBase = framesJsonUrl.replace(/\/[^/]*$/, "")
  const normalized = assetUrl.replace(/^\//, "")
  const lower = normalized.toLowerCase()

  for (const prefix of LEGACY_FRAME_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return `${framesBase}/${normalized.slice(prefix.length)}`
    }
  }

  // Playground paths like NexRad/Nov18/output/frame_00000.png — S3 IOP folder is flat:
  // NEXRAD/Nov18/frame_00000.png next to frames.json
  const frameFileName = normalized.split("/").pop()
  if (frameFileName && FRAME_FILE_PATTERN.test(frameFileName)) {
    if (lower.includes("/output/") || lower.startsWith("nexrad/")) {
      return `${framesBase}/${frameFileName}`
    }
  }

  if (lower.includes("/output/")) {
    const afterOutput = normalized.split(/\/output\//i).pop()
    if (afterOutput) {
      return `${framesBase}/${afterOutput}`
    }
  }

  const folderName = framesBase.split("/").pop() || ""
  if (assetUrl.startsWith("/") && folderName && assetUrl.startsWith(`/${folderName}/`)) {
    return `${framesBase}${assetUrl.slice(folderName.length + 1)}`
  }

  return `${framesBase}/${normalized}`
}

function getFrameImageUrlCandidates(framesJsonUrl, assetUrl) {
  const framesBase = framesJsonUrl.replace(/\/[^/]*$/, "")
  const normalized = (assetUrl || "").replace(/^\//, "")
  const fileName = normalized.split("/").pop()
  const urls = new Set()

  const resolved = resolveFrameAssetUrl(framesJsonUrl, assetUrl)
  if (resolved) urls.add(resolved)

  if (fileName && FRAME_FILE_PATTERN.test(fileName)) {
    urls.add(`${framesBase}/${fileName}`)
    urls.add(`${framesBase}/output/${fileName}`)
    LEGACY_FRAME_PREFIXES.forEach((prefix) => {
      urls.add(`${framesBase}/${prefix}${fileName}`)
    })
  }

  return [...urls]
}

function parseFramesPayload(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.frames)) return data.frames
  if (Array.isArray(data?.items)) return data.items
  return []
}

function normalizeFrameRecord(frame) {
  if (!frame || typeof frame !== "object") return null

  const bounds = frame.bounds || frame.extent || frame
  const west = Number(bounds.west ?? bounds.left ?? frame.west)
  const south = Number(bounds.south ?? bounds.bottom ?? frame.south)
  const east = Number(bounds.east ?? bounds.right ?? frame.east)
  const north = Number(bounds.north ?? bounds.top ?? frame.north)

  return {
    ...frame,
    west,
    south,
    east,
    north,
    timestamp: frame.timestamp || frame.time || frame.isoTime || null,
    image: frame.image || frame.url || frame.png || null,
    tileTemplate: frame.tileTemplate || frame.tileUrl || frame.template || null,
    minZoom: frame.minZoom ?? frame.minimumLevel,
    maxZoom: frame.maxZoom ?? frame.maximumLevel,
  }
}

function emitNexradState(nexradRefs) {
  if (
    nexradRefs?.sessionId != null &&
    nexradRefs.sessionId !== nexradSessionGeneration
  ) {
    return
  }

  const firstFrame = nexradRefs.framesMeta?.[0]?.timestamp || null
  const lastFrame =
    nexradRefs.framesMeta?.[nexradRefs.framesMeta.length - 1]?.timestamp || null

  emitter.emit("nexradStateChange", {
    frameIndex: nexradRefs.currentFrameIndex,
    totalFrames: nexradRefs.framesMeta?.length || 0,
    timestamp: nexradRefs.currentTimestamp,
    listingDate: nexradRefs.listingDate || null,
    clockStart: firstFrame,
    clockStop: lastFrame,
    radarCursorEnabled: nexradRefs.radarCursorEnabled,
    loadError: nexradRefs.loadError || null,
    frameError: nexradRefs.frameError || null,
    framesJsonUrl: nexradRefs.resolvedFramesJsonUrl || null,
    failedTriedUrls: nexradRefs.failedTriedUrls || [],
    leeDataSubfolders: nexradRefs.leeDataSubfolders || [],
  })
}

function isValidFrameBounds(frame) {
  const { west, south, east, north } = frame
  return (
    Number.isFinite(west) &&
    Number.isFinite(south) &&
    Number.isFinite(east) &&
    Number.isFinite(north) &&
    west < east &&
    south < north &&
    west >= -180 &&
    east <= 180 &&
    south >= -90 &&
    north <= 90
  )
}

function getClosestFrameIndex(framesMeta, currentMs) {
  if (!framesMeta?.length) return -1

  let bestIdx = 0
  let bestDt = Number.POSITIVE_INFINITY

  framesMeta.forEach((frame, index) => {
    const t = new Date(frame.timestamp).getTime()
    if (!Number.isFinite(t)) return
    const dt = Math.abs(t - currentMs)
    if (dt < bestDt) {
      bestDt = dt
      bestIdx = index
    }
  })

  return bestIdx
}

function cancelActiveViewerFlight(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return
  viewer.trackedEntity = undefined
  try {
    viewer.camera.cancelFlight()
  } catch (err) {
    console.warn("Could not cancel NEXRAD camera flight:", err)
  }
}

function flyCameraToNexradRectangle(viewer, frame) {
  if (!viewer || viewer.isDestroyed?.()) return
  if (!isValidFrameBounds(frame)) return

  cancelActiveViewerFlight(viewer)

  const rectangle = Rectangle.fromDegrees(frame.west, frame.south, frame.east, frame.north)
  viewer.camera.flyTo({
    destination: rectangle,
    duration: 1.5,
  })
}

function clearCurrentImageryLayer(viewer, nexradRefs) {
  if (!nexradRefs.currentLayer || !viewer || viewer.isDestroyed?.()) return

  try {
    viewer.imageryLayers.remove(nexradRefs.currentLayer, true)
  } catch (err) {
    console.warn("Could not remove NEXRAD imagery layer:", err)
  }

  nexradRefs.currentLayer = null
}

function isInsideCurrentRadarBounds(nexradRefs, lat, lon) {
  const frame = nexradRefs.currentFrameMeta
  if (!frame) return false
  return (
    isValidFrameBounds(frame) &&
    lon >= frame.west &&
    lon <= frame.east &&
    lat >= frame.south &&
    lat <= frame.north
  )
}

function removeHoverTooltip(nexradRefs) {
  if (nexradRefs.mouseHandler) {
    nexradRefs.mouseHandler.destroy()
    nexradRefs.mouseHandler = null
  }

  if (nexradRefs.hoverEl) {
    nexradRefs.hoverEl.remove()
    nexradRefs.hoverEl = null
  }
}

function addHoverTooltip(viewer, nexradRefs) {
  if (!viewer?.container) return

  removeHoverTooltip(nexradRefs)

  const hover = document.createElement("div")
  hover.className = "nexrad-hover"
  hover.style.position = "absolute"
  hover.style.pointerEvents = "none"
  hover.style.background = "rgba(0,0,0,0.84)"
  hover.style.color = "white"
  hover.style.padding = "8px 10px"
  hover.style.borderRadius = "8px"
  hover.style.fontSize = "12px"
  hover.style.fontFamily = "sans-serif"
  hover.style.zIndex = "1001"
  hover.style.display = "none"
  hover.style.whiteSpace = "nowrap"
  hover.style.maxWidth = "260px"
  hover.style.boxShadow = "0 2px 10px rgba(0,0,0,0.35)"

  viewer.container.appendChild(hover)
  nexradRefs.hoverEl = hover

  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement) => {
    if (!nexradRefs.radarCursorEnabled) {
      hover.style.display = "none"
      return
    }

    const cartesian = viewer.camera.pickEllipsoid(
      movement.endPosition,
      viewer.scene.globe.ellipsoid
    )

    if (!cartesian) {
      hover.style.display = "none"
      return
    }

    const cartographic = Cartographic.fromCartesian(cartesian)
    const lat = CesiumMath.toDegrees(cartographic.latitude)
    const lon = CesiumMath.toDegrees(cartographic.longitude)

    if (!isInsideCurrentRadarBounds(nexradRefs, lat, lon)) {
      hover.style.display = "none"
      return
    }

    const containerRect = viewer.container.getBoundingClientRect()
    const pad = 12
    let left = movement.endPosition.x + pad
    let top = movement.endPosition.y + pad

    hover.innerHTML =
      `<div style="font-weight:700; margin-bottom:4px;">Radar Cursor</div>` +
      `<div><b>Lat:</b> ${lat.toFixed(4)}</div>` +
      `<div><b>Lon:</b> ${lon.toFixed(4)}</div>` +
      `<div><b>Time:</b> ${nexradRefs.currentTimestamp || "unknown"}</div>`

    hover.style.display = "block"
    const tooltipRect = hover.getBoundingClientRect()

    if (left + tooltipRect.width > containerRect.width - 8) {
      left = movement.endPosition.x - tooltipRect.width - pad
    }
    if (top + tooltipRect.height > containerRect.height - 8) {
      top = movement.endPosition.y - tooltipRect.height - pad
    }

    hover.style.left = `${left}px`
    hover.style.top = `${top}px`
  }, ScreenSpaceEventType.MOUSE_MOVE)

  nexradRefs.mouseHandler = handler
}

async function createImageryProvider(frame, rectangle, framesJsonUrl) {
  const tileTemplate = resolveFrameAssetUrl(framesJsonUrl, frame.tileTemplate)

  if (tileTemplate) {
    const provider = new UrlTemplateImageryProvider({
      url: tileTemplate,
      rectangle,
      minimumLevel: Number.isFinite(frame.minZoom) ? frame.minZoom : 0,
      maximumLevel: Number.isFinite(frame.maxZoom) ? frame.maxZoom : 10,
      hasAlphaChannel: true,
    })
    if (provider.readyPromise) {
      await provider.readyPromise
    }
    return { provider, imageUrl: tileTemplate }
  }

  const candidates = getFrameImageUrlCandidates(framesJsonUrl, frame.image)
  if (!candidates.length) return null

  let lastError = null
  for (const imageUrl of candidates) {
    try {
      const provider = new SingleTileImageryProvider({
        url: imageUrl,
        rectangle,
      })
      if (provider.readyPromise) {
        await provider.readyPromise
      }
      return { provider, imageUrl }
    } catch (err) {
      lastError = err
      console.warn(`NEXRAD image failed at ${imageUrl}`, err)
    }
  }

  const error = new Error(
    lastError?.message || `Could not load NEXRAD image. Tried: ${candidates.join(", ")}`
  )
  error.triedImageUrls = candidates
  throw error
}

async function showFrameForCurrentTime(viewer, nexradRefs) {
  if (!nexradRefs.framesMeta?.length || viewer.isDestroyed?.()) return
  if (!isNexradLoadStillActive(nexradRefs)) return

  const requestId = ++nexradRefs.frameRequestId
  const currentMs = JulianDate.toDate(viewer.clock.currentTime).getTime()
  const idx = getClosestFrameIndex(nexradRefs.framesMeta, currentMs)

  if (idx < 0) return

  if (idx === nexradRefs.currentFrameIndex && nexradRefs.currentLayer) {
    nexradRefs.currentTimestamp = nexradRefs.framesMeta[idx]?.timestamp || null
    emitNexradState(nexradRefs)
    return
  }

  if (idx === nexradRefs.lastFailedFrameIndex && nexradRefs.frameError) {
    return
  }

  const frame = nexradRefs.framesMeta[idx]
  if (!isValidFrameBounds(frame)) {
    const message = `Invalid NEXRAD frame bounds at index ${idx}`
    console.error(message, frame)
    nexradRefs.frameError = message
    emitNexradState(nexradRefs)
    return
  }

  const rectangle = Rectangle.fromDegrees(frame.west, frame.south, frame.east, frame.north)

  try {
    const imageryResult = await createImageryProvider(
      frame,
      rectangle,
      nexradRefs.resolvedFramesJsonUrl
    )

    if (!imageryResult?.provider) {
      const message = `NEXRAD frame ${idx + 1} has no image or tileTemplate`
      console.error(message, frame)
      nexradRefs.frameError = message
      emitNexradState(nexradRefs)
      return
    }

    if (requestId !== nexradRefs.frameRequestId) return
    if (!isNexradLoadStillActive(nexradRefs)) return

    const { provider, imageUrl } = imageryResult
    clearCurrentImageryLayer(viewer, nexradRefs)

    const layer = viewer.imageryLayers.addImageryProvider(provider)
    viewer.imageryLayers.raiseToTop(layer)
    layer.alpha = 1.0
    layer.brightness = 1.18
    layer.contrast = 1.28
    layer.saturation = 1.2
    layer.gamma = 1.0

    nexradRefs.currentLayer = layer
    nexradRefs.currentFrameIndex = idx
    nexradRefs.currentTimestamp = frame.timestamp || null
    nexradRefs.currentFrameMeta = frame
    nexradRefs.frameError = null
    nexradRefs.lastFailedFrameIndex = -1
    nexradRefs.lastResolvedImageUrl = imageUrl
    nexradRefs.cesiumLayerRef = layer

    if (!nexradRefs.hasFlownToRadar) {
      nexradRefs.hasFlownToRadar = true
      flyCameraToNexradRectangle(viewer, frame)
    }

    emitNexradState(nexradRefs)
    viewer.scene.requestRender()
  } catch (err) {
    const triedImageUrls =
      err?.triedImageUrls ||
      getFrameImageUrlCandidates(
        nexradRefs.resolvedFramesJsonUrl,
        frame.image || frame.tileTemplate
      )
    const message = `Failed to display NEXRAD frame ${idx + 1}: ${err?.message || err}`
    console.error(message, { frame, triedImageUrls }, err)
    nexradRefs.frameError = message
    nexradRefs.failedTriedUrls = triedImageUrls
    nexradRefs.lastFailedFrameIndex = idx

    if (!nexradRefs.hasFlownToRadar) {
      nexradRefs.hasFlownToRadar = true
      flyCameraToNexradRectangle(viewer, frame)
    }

    emitNexradState(nexradRefs)
  }
}

function unregisterNexradClockTick(viewer, nexradRefs) {
  if (!viewer || viewer.isDestroyed?.() || !nexradRefs?.clockTickHandler) return
  viewer.clock.onTick.removeEventListener(nexradRefs.clockTickHandler)
  nexradRefs.clockTickHandler = null
}

function registerNexradClockTick(viewer, nexradRefs) {
  unregisterNexradClockTick(viewer, nexradRefs)

  let lastSecond = null
  const onTick = () => {
    if (viewer.isDestroyed?.()) return
    if (!isNexradLoadStillActive(nexradRefs)) return

    const sec = Math.floor(
      JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime)
    )

    if (sec !== lastSecond) {
      lastSecond = sec
      showFrameForCurrentTime(viewer, nexradRefs)
    }
  }

  viewer.clock.onTick.addEventListener(onTick)
  nexradRefs.clockTickHandler = onTick
}

export function applyNexradViewerClock(viewer, layer, nexradRefs, options = {}) {
  if (!viewer || viewer.isDestroyed?.() || !nexradRefs?.framesMeta?.length) return

  const startTime = JulianDate.fromIso8601(nexradRefs.framesMeta[0].timestamp)
  const endTime = JulianDate.fromIso8601(
    nexradRefs.framesMeta[nexradRefs.framesMeta.length - 1].timestamp
  )

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = endTime.clone()
  viewer.clock.currentTime = startTime.clone()
  viewer.clock.multiplier = layer?.clockMultiplier || 60
  viewer.clock.shouldAnimate = options.shouldAnimate !== false
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, endTime)
  }

  if (!options.skipInitialFrame) {
    showFrameForCurrentTime(viewer, nexradRefs)
  }
}

async function fetchFramesMeta(layer) {
  const candidates = getFramesJsonCandidates(layer)
  if (!candidates.length) {
    throw new Error(
      "Missing NEXRAD frames URL. Set REACT_APP_NEW_FIELD_CAMPAIGNS_BASE_URL in .env"
    )
  }

  let lastError = null

  for (const url of candidates) {
    try {
      const resp = await fetch(url, { cache: "no-store" })
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} for ${url}`)
      }

      const payload = await resp.json()
      const rawFrames = parseFramesPayload(payload)
      const sorted = rawFrames
        .map(normalizeFrameRecord)
        .filter((frame) => frame?.timestamp)
        .sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

      if (!sorted.length) {
        throw new Error(`frames.json has no valid timestamps: ${url}`)
      }

      validateFramesForLayer(layer, sorted, url, payload)

      console.log(`Loaded NEXRAD frames.json (${sorted.length} frames): ${url}`)
      return { framesMeta: sorted, url }
    } catch (err) {
      lastError = err
      console.warn(`NEXRAD frames failed at ${url}`, err)
    }
  }

  const error = new Error(lastError?.message || "Could not load NEXRAD frames.json")
  error.triedUrls = candidates
  throw error
}

function registerNexradEmitterHandlers(nexradRefs) {
  const onCursorChange = (enabled) => {
    nexradRefs.radarCursorEnabled = !!enabled
    if (!nexradRefs.radarCursorEnabled && nexradRefs.hoverEl) {
      nexradRefs.hoverEl.style.display = "none"
    }
    emitNexradState(nexradRefs)
  }

  emitter.on("nexradCursorChange", onCursorChange)
  nexradRefs.emitterHandlers = { onCursorChange }
}

function unregisterNexradEmitterHandlers(nexradRefs) {
  if (!nexradRefs?.emitterHandlers) return
  emitter.off("nexradCursorChange", nexradRefs.emitterHandlers.onCursorChange)
  nexradRefs.emitterHandlers = null
}

export function unloadNexradLayer(viewer, nexradRefs) {
  if (!nexradRefs) return

  if (nexradRefs.sessionId === nexradSessionGeneration) {
    nexradSessionGeneration += 1
  }

  cancelActiveViewerFlight(viewer)
  unregisterNexradEmitterHandlers(nexradRefs)
  unregisterNexradClockTick(viewer, nexradRefs)
  removeHoverTooltip(nexradRefs)
  clearCurrentImageryLayer(viewer, nexradRefs)

  emitNexradState({
    sessionId: nexradSessionGeneration,
    currentFrameIndex: -1,
    framesMeta: [],
    currentTimestamp: null,
    listingDate: null,
    radarCursorEnabled: true,
    loadError: null,
    frameError: null,
    resolvedFramesJsonUrl: null,
    failedTriedUrls: [],
    leeDataSubfolders: [],
  })
}

export function unloadAllNexradLayers(viewer, activeLayers) {
  if (!activeLayers?.length) return []

  const removed = []
  activeLayers.forEach((entry) => {
    if (entry?.layer?.displayMechanism !== "nexrad") return
    unloadNexradLayer(viewer, entry.nexradRefs)
    removed.push(entry.layer.layerId)
  })
  return removed
}

function clearPendingNexradLoad(layerId) {
  if (layerId) {
    pendingNexradLoads.delete(layerId)
  }
}

export function loadNexradLayer(viewer, layer) {
  const layerId = layer?.layerId
  const existingPending = pendingNexradLoads.get(layerId)
  if (existingPending) {
    unloadNexradLayer(existingPending.viewer || viewer, existingPending.nexradRefs)
    pendingNexradLoads.delete(layerId)
  }

  const loadSession = getLayerLoadSession(layerId)

  nexradSessionGeneration += 1
  const sessionId = nexradSessionGeneration

  const nexradRefs = {
    layerId,
    loadSession,
    sessionId,
    framesMeta: null,
    resolvedFramesJsonUrl: null,
    listingDate: layer?.listingDate || layer?.date || null,
    leeDataSubfolders: layer?.leeDataSubfolders || [],
    currentLayer: null,
    currentFrameIndex: -1,
    currentFrameMeta: null,
    currentTimestamp: null,
    frameRequestId: 0,
    hasFlownToRadar: false,
    radarCursorEnabled: true,
    loadError: null,
    frameError: null,
    lastFailedFrameIndex: -1,
    failedTriedUrls: [],
    clockTickHandler: null,
    mouseHandler: null,
    hoverEl: null,
    cesiumLayerRef: null,
  }

  registerNexradEmitterHandlers(nexradRefs)
  pendingNexradLoads.set(layerId, { viewer, nexradRefs, loadSession })

  return fetchFramesMeta(layer)
    .then(async ({ framesMeta, url }) => {
      if (viewer.isDestroyed?.()) {
        clearPendingNexradLoad(layerId)
        return null
      }
      if (!isLayerLoadActive(layerId, loadSession)) {
        unloadNexradLayer(viewer, nexradRefs)
        clearPendingNexradLoad(layerId)
        return null
      }

      nexradRefs.framesMeta = framesMeta
      nexradRefs.resolvedFramesJsonUrl = url
      nexradRefs.loadError = null
      nexradRefs.failedTriedUrls = []

      applyNexradViewerClock(viewer, layer, nexradRefs, {
        skipInitialFrame: true,
        shouldAnimate: false,
      })
      addHoverTooltip(viewer, nexradRefs)
      await showFrameForCurrentTime(viewer, nexradRefs)

      if (!isLayerLoadActive(layerId, loadSession)) {
        unloadNexradLayer(viewer, nexradRefs)
        clearPendingNexradLoad(layerId)
        return null
      }

      if (!nexradRefs.currentLayer) {
        const tried = nexradRefs.failedTriedUrls?.length
          ? ` Tried images: ${nexradRefs.failedTriedUrls.join(", ")}`
          : ""
        throw new Error(
          (nexradRefs.frameError || "NEXRAD frames loaded but no imagery could be displayed") +
            tried
        )
      }

      viewer.clock.shouldAnimate = true
      registerNexradClockTick(viewer, nexradRefs)
      emitNexradState(nexradRefs)
      clearPendingNexradLoad(layerId)

      return {
        cesiumLayerRef: nexradRefs.currentLayer,
        nexradRefs,
      }
    })
    .catch((err) => {
      unloadNexradLayer(viewer, nexradRefs)
      clearPendingNexradLoad(layerId)
      nexradRefs.loadError = err?.message || "Failed to load NEXRAD"
      if (!nexradRefs.failedTriedUrls?.length) {
        nexradRefs.failedTriedUrls = err?.triedUrls || getFramesJsonCandidates(layer)
      }
      emitNexradState(nexradRefs)
      throw err
    })
}
