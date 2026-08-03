import {
  BoundingSphere,
  Cartesian3,
  HeadingPitchRange,
  Math as CesiumMath,
} from "cesium"

const REGIONAL_DISPLAY_MECHANISMS = new Set([
  "dow7",
  "nexrad",
  "efm",
  "soundingCzml",
  "lma3dtile",
])

const WIDE_AREA_DISPLAY_MECHANISMS = new Set(["glm"])

/** Lake Ontario / Tug Hill — top-down, single regional layer fallback */
export const LEE_REGIONAL_CAMERA = {
  lon: -76.2,
  lat: 43.8,
  height: 350000,
  heading: 0,
  pitch: -90,
}

/**
 * Two or more instruments — oblique regional view over the LEE IOP (Lake Ontario /
 * Tug Hill). Tuned to match the reference FCX framing: horizon visible, Toronto–
 * Buffalo corridor in frame, IOP markers centered.
 */
export const LEE_MULTI_INSTRUMENT_CAMERA = {
  center: { lon: -76.32, lat: 43.58 },
  radius: 185000,
  heading: 18,
  pitch: -32,
  range: 740000,
}

/** Continental view for GLM-only exploration */
export const LEE_GLM_CONTINENTAL_CAMERA = {
  lon: -98,
  lat: 39,
  height: 6500000,
  heading: 0,
  pitch: -90,
}

export function getActiveLeeLayerCount(activeLayerEntries) {
  return (activeLayerEntries || []).filter(
    (entry) => entry?.layer?.fieldCampaignName === "LEE"
  ).length
}

export function shouldUseLeeMultiInstrumentCamera(activeLayerEntries) {
  return getActiveLeeLayerCount(activeLayerEntries) >= 2
}

export function isLeeRegionalLayer(layer) {
  return (
    layer?.fieldCampaignName === "LEE" &&
    REGIONAL_DISPLAY_MECHANISMS.has(layer.displayMechanism)
  )
}

export function isLeeWideAreaLayer(layer) {
  return (
    layer?.fieldCampaignName === "LEE" &&
    WIDE_AREA_DISPLAY_MECHANISMS.has(layer.displayMechanism)
  )
}

export function shouldUseLeeRegionalCamera(activeLayerEntries) {
  return (activeLayerEntries || []).some((entry) => isLeeRegionalLayer(entry?.layer))
}

export function shouldUseLeeWideAreaCamera(activeLayerEntries) {
  const entries = activeLayerEntries || []
  const hasWideArea = entries.some((entry) => isLeeWideAreaLayer(entry?.layer))
  return hasWideArea && !shouldUseLeeRegionalCamera(entries)
}

export function shouldLeeRegionalLayerFlyOnLoad(layer, activeLayerEntries, loadingLayerId) {
  if (layer?.fieldCampaignName !== "LEE") return true
  if (!isLeeRegionalLayer(layer)) return true

  const otherRegional = (activeLayerEntries || []).filter(
    (entry) =>
      entry?.layer?.layerId !== loadingLayerId &&
      isLeeRegionalLayer(entry.layer)
  )
  return otherRegional.length === 0
}

export function shouldLeeWideAreaLayerFlyOnLoad(layer, activeLayerEntries, loadingLayerId) {
  if (layer?.fieldCampaignName !== "LEE") return true
  if (!isLeeWideAreaLayer(layer)) return true

  const others = (activeLayerEntries || []).filter(
    (entry) => entry?.layer?.layerId !== loadingLayerId
  )
  return !shouldUseLeeRegionalCamera(others)
}

export function getLeeMultiInstrumentCamera(activeLayerEntries) {
  const hasDow7 = (activeLayerEntries || []).some(
    (entry) => entry?.layer?.displayMechanism === "dow7"
  )

  if (!hasDow7) {
    return LEE_MULTI_INSTRUMENT_CAMERA
  }

  return {
    ...LEE_MULTI_INSTRUMENT_CAMERA,
    range: 560000,
    pitch: -34,
  }
}

export function flyToLeeCamera(viewer, camera) {
  if (!viewer || viewer.isDestroyed?.() || !camera) return

  try {
    viewer.camera.cancelFlight()
  } catch {
    // ignore
  }

  if (camera.center && camera.radius != null && camera.range != null) {
    const sphere = new BoundingSphere(
      Cartesian3.fromDegrees(camera.center.lon, camera.center.lat, 0),
      camera.radius
    )
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new HeadingPitchRange(
        CesiumMath.toRadians(camera.heading ?? 0),
        CesiumMath.toRadians(camera.pitch ?? -44),
        camera.range
      ),
      duration: 2,
    })
    return
  }

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(camera.lon, camera.lat, camera.height),
    orientation: {
      heading: CesiumMath.toRadians(camera.heading ?? 0),
      pitch: CesiumMath.toRadians(camera.pitch ?? -90),
      roll: 0,
    },
    duration: 1.5,
  })
}
