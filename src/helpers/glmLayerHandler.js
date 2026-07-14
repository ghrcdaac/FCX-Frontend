import {
  JulianDate,
  Cartesian3,
  Color,
  ClockRange,
  PointPrimitiveCollection,
  BoundingSphere,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium"
import emitter from "./event"
import {
  dataBaseUrl,
  leeGlmLeePointsPath,
  leeGlmPointsFile,
  leeInstrumentIopPath,
  newFieldCampaignsBaseUrl,
} from "../config"
import {
  DEFAULT_GLM_DISPLAY_MODE,
  GLM_IOP2_EPOCH,
  GLM_IOP2_START,
  GLM_IOP2_END,
  GLM_CLOCK_MULTIPLIER,
} from "./glmConstants"
import { flyToLeeCamera } from "./leeCameraPolicy"
import { getLayerLoadSession, isLayerLoadActive } from "./layerLoadSession"

const FADE_WINDOW = 180
const HIDE_WINDOW = 480
const TICK_INTERVAL_SEC = 5

function addPointsUrlVariant(urls, url) {
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

function getIopGlmPointsJsonCandidates(layer) {
  const iopFolder = layer?.leeDataSubfolders?.[0]
  if (!iopFolder) return []

  const urls = new Set()

  addPointsUrlVariant(urls, layer?.pointsJsonUrl)
  addPointsUrlVariant(urls, leeGlmLeePointsPath(iopFolder))
  addPointsUrlVariant(urls, leeInstrumentIopPath("GLM", iopFolder, leeGlmPointsFile))

  if (newFieldCampaignsBaseUrl) {
    const base = newFieldCampaignsBaseUrl.replace(/\/$/, "")
    addPointsUrlVariant(
      urls,
      `${base}/Lee/instrument-processed-data/GLM/${iopFolder}/${leeGlmPointsFile}`
    )
    addPointsUrlVariant(
      urls,
      `${base}/LEE/instrument-processed-data/GLM/${iopFolder}/${leeGlmPointsFile}`
    )
  }

  if (dataBaseUrl) {
    const base = dataBaseUrl.replace(/\/$/, "")
    addPointsUrlVariant(
      urls,
      `${base}/fieldcampaign/Lee/instrument-processed-data/GLM/${iopFolder}/${leeGlmPointsFile}`
    )
  }

  return [...urls]
}

export function getGlmPointsJsonCandidates(layer) {
  if ((layer?.leeDataSubfolders || []).length > 0) {
    return getIopGlmPointsJsonCandidates(layer)
  }

  return layer?.pointsJsonUrl ? [layer.pointsJsonUrl] : []
}

function emitGlmState(glmRefs) {
  emitter.emit("glmStateChange", {
    displayMode: glmRefs?.displayMode ?? DEFAULT_GLM_DISPLAY_MODE,
    pointCount: glmRefs?.pointRefs?.length ?? 0,
    loadError: glmRefs?.loadError ?? null,
    pointsJsonUrl: glmRefs?.resolvedPointsJsonUrl ?? null,
    failedTriedUrls: glmRefs?.failedTriedUrls ?? [],
    hoverEnabled: glmRefs?.hoverEnabled !== false,
  })
}

function getColor(value, alpha) {
  if (value > 0.85) return Color.WHITE.withAlpha(alpha)
  if (value > 0.65) return Color.YELLOW.withAlpha(alpha)
  if (value > 0.4) return Color.ORANGE.withAlpha(alpha)
  if (value > 0.2) return Color.RED.withAlpha(alpha)
  return Color.CYAN.withAlpha(alpha)
}

function getIntensityLabel(value) {
  if (value > 0.85) return "Very High"
  if (value > 0.65) return "High"
  if (value > 0.4) return "Medium"
  if (value > 0.2) return "Low"
  return "Very Low"
}

function getIntensityCssColor(value) {
  if (value > 0.85) return "#ffffff"
  if (value > 0.65) return "#ffe44d"
  if (value > 0.4) return "#ff9f43"
  if (value > 0.2) return "#ff5c5c"
  return "#4dd2ff"
}

function clearHoveredPoint(glmRefs) {
  if (!glmRefs?.hoveredPointRef) return

  const p = glmRefs.hoveredPointRef.point
  p.outlineColor = Color.TRANSPARENT
  p.outlineWidth = 0
  p.pixelSize = glmRefs.hoveredPointRef.basePixelSize
  glmRefs.hoveredPointRef = null
}

function setHoveredPoint(glmRefs, pointRef) {
  if (glmRefs.hoveredPointRef === pointRef) return
  clearHoveredPoint(glmRefs)
  glmRefs.hoveredPointRef = pointRef
}

function updateHoveredGlow(glmRefs, currentRelSec) {
  if (!glmRefs?.hoveredPointRef?.point?.show) return

  const pulse = 0.5 + 0.5 * Math.sin(currentRelSec * 0.35)
  const ref = glmRefs.hoveredPointRef

  ref.point.outlineColor = Color.WHITE.withAlpha(0.95)
  ref.point.outlineWidth = 2 + 2 * pulse
  ref.point.pixelSize = ref.basePixelSize + 2 + 2 * pulse
}

function updatePoints(glmRefs, currentRelSec) {
  if (!glmRefs?.pointRefs?.length) return

  for (let i = 0; i < glmRefs.pointRefs.length; i++) {
    const p = glmRefs.pointRefs[i]

    if (glmRefs.displayMode === "fullDay") {
      p.point.show = true
      p.point.color = getColor(p.value, 1.0)
      p.basePixelSize = 6
      if (glmRefs.hoveredPointRef !== p) {
        p.point.pixelSize = 6
        p.point.outlineColor = Color.TRANSPARENT
        p.point.outlineWidth = 0
      }
      continue
    }

    if (glmRefs.displayMode === "accumulate") {
      p.point.show = p.time <= currentRelSec
      p.point.color = p.point.show ? getColor(p.value, 1.0) : Color.TRANSPARENT
      p.basePixelSize = 6
      if (glmRefs.hoveredPointRef !== p) {
        p.point.pixelSize = 6
        p.point.outlineColor = Color.TRANSPARENT
        p.point.outlineWidth = 0
      }
      continue
    }

    const absDt = Math.abs(currentRelSec - p.time)

    if (absDt > HIDE_WINDOW) {
      p.point.show = false
      continue
    }

    p.point.show = true
    const alpha = Math.max(0.0, 1.0 - absDt / FADE_WINDOW)
    p.point.color = getColor(p.value, alpha)
    p.basePixelSize = 6
    if (glmRefs.hoveredPointRef !== p) {
      p.point.pixelSize = 6
      p.point.outlineColor = Color.TRANSPARENT
      p.point.outlineWidth = 0
    }
  }
}

function createHoverBox(viewer, glmRefs) {
  removeHoverBox(glmRefs)

  const box = document.createElement("div")
  box.className = "glm-hover"
  box.style.position = "absolute"
  box.style.display = "none"
  box.style.pointerEvents = "none"
  box.style.zIndex = "1000"
  box.style.background = "rgba(20, 20, 20, 0.90)"
  box.style.color = "white"
  box.style.padding = "10px 12px"
  box.style.borderRadius = "10px"
  box.style.fontFamily = "sans-serif"
  box.style.fontSize = "12px"
  box.style.lineHeight = "1.45"
  box.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"
  box.style.whiteSpace = "nowrap"
  box.style.border = "1px solid rgba(255,255,255,0.12)"
  box.style.minWidth = "180px"

  viewer.container.appendChild(box)
  glmRefs.hoverEl = box
}

function removeHoverBox(glmRefs) {
  if (glmRefs?.hoverEl) {
    glmRefs.hoverEl.remove()
    glmRefs.hoverEl = null
  }
}

function showHoverBox(glmRefs, x, y, html) {
  if (!glmRefs?.hoverEl) return
  glmRefs.hoverEl.innerHTML = html
  glmRefs.hoverEl.style.left = `${x + 14}px`
  glmRefs.hoverEl.style.top = `${y + 14}px`
  glmRefs.hoverEl.style.display = "block"
}

function hideHoverBox(glmRefs) {
  if (!glmRefs?.hoverEl) return
  glmRefs.hoverEl.style.display = "none"
}

function installHoverHandler(viewer, glmRefs) {
  removeHoverHandler(glmRefs)

  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

  handler.setInputAction((movement) => {
    if (!glmRefs.hoverEnabled) {
      clearHoveredPoint(glmRefs)
      hideHoverBox(glmRefs)
      return
    }

    const picked = viewer.scene.pick(movement.endPosition)

    if (!picked?.primitive) {
      clearHoveredPoint(glmRefs)
      hideHoverBox(glmRefs)
      return
    }

    const match = glmRefs.pointRefs.find((p) => p.point === picked.primitive)

    if (!match?.point?.show) {
      clearHoveredPoint(glmRefs)
      hideHoverBox(glmRefs)
      return
    }

    setHoveredPoint(glmRefs, match)

    const intensityColor = getIntensityCssColor(match.value)
    const intensityLabel = getIntensityLabel(match.value)

    const rows = []
    rows.push(`<div><b>Lat:</b> ${match.lat.toFixed(4)}</div>`)
    rows.push(`<div><b>Lon:</b> ${match.lon.toFixed(4)}</div>`)

    if (Number.isFinite(match.alt)) {
      rows.push(`<div><b>Alt:</b> ${match.alt.toFixed(0)} m</div>`)
    }

    if (Number.isFinite(match.value)) {
      rows.push(
        `<div><b>Intensity:</b> <span style="color:${intensityColor};font-weight:700;">${match.value.toFixed(3)}</span></div>`
      )
      rows.push(
        `<div><b>Level:</b> <span style="color:${intensityColor};font-weight:700;">${intensityLabel}</span></div>`
      )
    }

    if (Number.isFinite(match.time) && glmRefs.epochJulian) {
      const absTime = JulianDate.addSeconds(
        glmRefs.epochJulian,
        match.time,
        new JulianDate()
      )
      rows.push(`<div><b>Time:</b> ${JulianDate.toIso8601(absTime)}</div>`)
    }

    showHoverBox(glmRefs, movement.endPosition.x, movement.endPosition.y, rows.join(""))
  }, ScreenSpaceEventType.MOUSE_MOVE)

  glmRefs.mouseHandler = handler
}

function removeHoverHandler(glmRefs) {
  if (glmRefs?.mouseHandler) {
    glmRefs.mouseHandler.destroy()
    glmRefs.mouseHandler = null
  }
}

function registerClockTick(viewer, glmRefs) {
  if (glmRefs?.useSharedLeeClock) return
  unregisterClockTick(viewer, glmRefs)

  const onTick = () => {
    if (!glmRefs.epochJulian) return

    const currentRelSec = Math.floor(
      JulianDate.secondsDifference(viewer.clock.currentTime, glmRefs.epochJulian)
    )

    if (Math.abs(currentRelSec - glmRefs.lastRelSec) >= TICK_INTERVAL_SEC) {
      glmRefs.lastRelSec = currentRelSec
      updatePoints(glmRefs, currentRelSec)
    }

    updateHoveredGlow(glmRefs, currentRelSec)
  }

  glmRefs.clockTickHandler = viewer.clock.onTick.addEventListener(onTick)
}

function unregisterClockTick(viewer, glmRefs) {
  if (glmRefs?.clockTickHandler) {
    viewer.clock.onTick.removeEventListener(glmRefs.clockTickHandler)
    glmRefs.clockTickHandler = null
  }
}

async function fetchPointsData(layer) {
  const candidates = getGlmPointsJsonCandidates(layer)
  if (!candidates.length) {
    throw new Error(
      "Missing GLM points URL. Set REACT_APP_NEW_FIELD_CAMPAIGNS_BASE_URL in .env"
    )
  }

  let lastError = null

  for (const url of candidates) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} for ${url}`)
      }

      const payload = await resp.json()
      const data = Array.isArray(payload) ? payload : payload?.points

      if (!Array.isArray(data) || !data.length) {
        throw new Error(`points.json has no point records: ${url}`)
      }

      console.log(`Loaded GLM points.json (${data.length} points): ${url}`)
      return { data, url }
    } catch (err) {
      lastError = err
      console.warn(`GLM points failed at ${url}`, err)
    }
  }

  const error = new Error(lastError?.message || "Could not load GLM points.json")
  error.triedUrls = candidates
  throw error
}

function buildPointPrimitives(viewer, glmRefs, data, cameraOptions = {}) {
  const { flyOnLoad = true, continentalCamera } = cameraOptions
  const positions = []
  const pointRefs = []

  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    const lon = Number(d.lon)
    const lat = Number(d.lat)
    const alt = Number(d.alt ?? 0)
    const time = Number(d.time ?? 0)
    const value = Number(d.value ?? 0)

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue

    const position = Cartesian3.fromDegrees(lon, lat, alt)
    positions.push(position)

    const point = glmRefs.pointsCollection.add({
      position,
      pixelSize: 6,
      color: Color.TRANSPARENT,
      outlineColor: Color.TRANSPARENT,
      outlineWidth: 0,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    })

    pointRefs.push({
      point,
      time,
      value,
      lat,
      lon,
      alt,
      basePixelSize: 6,
    })
  }

  glmRefs.pointRefs = pointRefs

  if (positions.length > 0 && flyOnLoad) {
    if (continentalCamera) {
      flyToLeeCamera(viewer, continentalCamera)
    } else {
      const sphere = BoundingSphere.fromPoints(positions)
      viewer.camera.flyToBoundingSphere(sphere, { duration: 1.5 })
    }
  }
}

function registerGlmEmitterHandlers(glmRefs) {
  const onDisplayModeChange = (mode) => {
    if (!mode || !glmRefs) return
    glmRefs.displayMode = mode
    const currentRelSec = Math.floor(
      JulianDate.secondsDifference(
        glmRefs.viewer?.clock?.currentTime || JulianDate.fromIso8601(GLM_IOP2_START),
        glmRefs.epochJulian || JulianDate.fromIso8601(GLM_IOP2_EPOCH)
      )
    )
    updatePoints(glmRefs, currentRelSec)
    emitGlmState(glmRefs)
  }

  const onHoverChange = (enabled) => {
    glmRefs.hoverEnabled = !!enabled
    if (!glmRefs.hoverEnabled) {
      clearHoveredPoint(glmRefs)
      hideHoverBox(glmRefs)
    }
    emitGlmState(glmRefs)
  }

  emitter.on("glmDisplayModeChange", onDisplayModeChange)
  emitter.on("glmHoverChange", onHoverChange)

  glmRefs.emitterHandlers = { onDisplayModeChange, onHoverChange }
}

function unregisterGlmEmitterHandlers(glmRefs) {
  if (!glmRefs?.emitterHandlers) return
  emitter.off("glmDisplayModeChange", glmRefs.emitterHandlers.onDisplayModeChange)
  emitter.off("glmHoverChange", glmRefs.emitterHandlers.onHoverChange)
  glmRefs.emitterHandlers = null
}

export function setGlmLayerVisible(glmRefs, visible) {
  if (glmRefs?.pointsCollection) {
    glmRefs.pointsCollection.show = !!visible
  }
}

export function syncGlmAtViewerTime(viewer, glmRefs, layer) {
  if (!viewer || viewer.isDestroyed?.() || !glmRefs?.epochJulian) return

  const currentRelSec = Math.floor(
    JulianDate.secondsDifference(viewer.clock.currentTime, glmRefs.epochJulian)
  )

  if (currentRelSec !== glmRefs.lastRelSec) {
    glmRefs.lastRelSec = currentRelSec
    updatePoints(glmRefs, currentRelSec)
  }

  updateHoveredGlow(glmRefs, currentRelSec)
  viewer.scene.requestRender()
}

export function applyGlmViewerClock(viewer, layer, glmRefs, options = {}) {
  if (!viewer || viewer.isDestroyed?.()) return

  if (options.skipViewerClock) {
    syncGlmAtViewerTime(viewer, glmRefs, layer)
    return
  }

  const startIso = layer?.start || GLM_IOP2_START
  const endIso = layer?.end || GLM_IOP2_END
  const epochIso = layer?.epochIso || GLM_IOP2_EPOCH

  const startTime = JulianDate.fromIso8601(startIso)
  const endTime = JulianDate.fromIso8601(endIso)

  glmRefs.epochJulian = JulianDate.fromIso8601(epochIso)

  viewer.automaticallyTrackDataSourceClocks = false
  viewer.clock.startTime = startTime.clone()
  viewer.clock.stopTime = endTime.clone()
  viewer.clock.currentTime = startTime.clone()
  viewer.clock.multiplier = layer?.clockMultiplier || GLM_CLOCK_MULTIPLIER
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(startTime, endTime)
  }

  glmRefs.lastRelSec = Number.NEGATIVE_INFINITY
  updatePoints(glmRefs, 0)
}

export function unloadGlmLayer(viewer, glmRefs) {
  if (!glmRefs) return

  unregisterGlmEmitterHandlers(glmRefs)
  unregisterClockTick(viewer, glmRefs)
  removeHoverHandler(glmRefs)
  removeHoverBox(glmRefs)
  clearHoveredPoint(glmRefs)

  if (glmRefs.pointsCollection && viewer && !viewer.isDestroyed?.()) {
    viewer.scene.primitives.remove(glmRefs.pointsCollection)
  }

  emitGlmState({
    displayMode: DEFAULT_GLM_DISPLAY_MODE,
    pointRefs: [],
    loadError: null,
    resolvedPointsJsonUrl: null,
    failedTriedUrls: [],
    hoverEnabled: true,
  })
}

export function loadGlmLayer(viewer, layer, options = {}) {
  const { flyOnLoad = true, continentalCamera } = options
  const layerId = layer?.layerId
  const session = getLayerLoadSession(layerId)

  const glmRefs = {
    viewer,
    layer,
    pointsCollection: null,
    pointRefs: [],
    displayMode: DEFAULT_GLM_DISPLAY_MODE,
    epochJulian: null,
    lastRelSec: Number.NEGATIVE_INFINITY,
    clockTickHandler: null,
    mouseHandler: null,
    hoverEl: null,
    hoveredPointRef: null,
    hoverEnabled: true,
    loadError: null,
    resolvedPointsJsonUrl: null,
    failedTriedUrls: [],
    emitterHandlers: null,
  }

  registerGlmEmitterHandlers(glmRefs)

  return fetchPointsData(layer)
    .then(({ data, url }) => {
      if (viewer.isDestroyed?.()) return null
      if (!isLayerLoadActive(layerId, session)) {
        unregisterGlmEmitterHandlers(glmRefs)
        return null
      }

      glmRefs.pointsCollection = viewer.scene.primitives.add(new PointPrimitiveCollection())
      glmRefs.resolvedPointsJsonUrl = url
      glmRefs.loadError = null
      glmRefs.failedTriedUrls = []
      glmRefs.useSharedLeeClock = options.skipViewerClock === true

      buildPointPrimitives(viewer, glmRefs, data, { flyOnLoad, continentalCamera })
      applyGlmViewerClock(viewer, layer, glmRefs, {
        skipViewerClock: options.skipViewerClock === true,
      })
      createHoverBox(viewer, glmRefs)
      installHoverHandler(viewer, glmRefs)
      registerClockTick(viewer, glmRefs)
      emitGlmState(glmRefs)

      return {
        cesiumLayerRef: glmRefs.pointsCollection,
        glmRefs,
      }
    })
    .catch((err) => {
      const triedUrls = err?.triedUrls || getGlmPointsJsonCandidates(layer)
      glmRefs.loadError = err?.message || "Failed to load GLM"
      glmRefs.failedTriedUrls = triedUrls
      console.error("Error loading GLM:", err)
      if (triedUrls.length) {
        console.error("GLM points.json URLs tried:", triedUrls)
      }
      emitGlmState(glmRefs)
      throw err
    })
}
