import moment from "moment"
import { leeEfmCzmlPath, newFieldCampaignsBaseUrl } from "../config"
import { getLeeKnownLayerAvailability } from "../layers/lee-layers/components/instrumentLayers/helpers/leeIop2"
import { getLeeLayerDatasetTimes } from "../layers/lee-layers/components/instrumentLayers/helpers/leeInstrumentDatasetTimes"
import { resolveLeeS3Url } from "./leeS3Url"

const probeCache = new Map()
const datasetTimesCache = new Map()

const LEE_INSTRUMENT_TIME_KEYS = {
  dow7: "dow7",
  nexrad: "nexrad",
  glm: "glm",
  lma3dtile: "lma",
  efm: "efm",
  soundingCzml: null,
}

function isLeeSzgUrl(url) {
  return (
    typeof url === "string" &&
    !!newFieldCampaignsBaseUrl &&
    url.includes(newFieldCampaignsBaseUrl)
  )
}

function preferSzgProbeUrl(candidates) {
  const urls = (candidates || []).filter(Boolean)
  if (!urls.length) return null
  return urls.find(isLeeSzgUrl) || urls[0]
}

function leeSzgInstrumentUrl(instrumentFolder, iopFolder, ...segments) {
  if (!instrumentFolder || !iopFolder || !newFieldCampaignsBaseUrl) return null
  return [
    newFieldCampaignsBaseUrl,
    "Lee/instrument-processed-data",
    instrumentFolder,
    iopFolder,
    ...segments,
  ]
    .filter(Boolean)
    .join("/")
}

export async function probeResourceUrl(url) {
  if (!url) return false
  if (probeCache.has(url)) return probeCache.get(url)

  try {
    const resp = await fetch(resolveLeeS3Url(url), {
      method: "GET",
      cache: "no-store",
      mode: "cors",
      headers: { Range: "bytes=0-0" },
    })
    const ok = resp.ok || resp.status === 206
    probeCache.set(url, ok)
    return ok
  } catch {
    // szg bucket often blocks CORS on fetch probes but still serves tiles to Cesium.
    const assumed = isLeeSzgUrl(url)
    probeCache.set(url, assumed)
    return assumed
  }
}

async function probeFirstAvailableUrl(urls) {
  for (const url of urls) {
    if (await probeResourceUrl(url)) {
      return true
    }
  }
  return false
}

export function getLeeLayerProbeUrls(layer) {
  if (!layer) return []

  switch (layer.displayMechanism) {
    case "dow7": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      if (!iopFolder) return []

      const canonical = newFieldCampaignsBaseUrl
        ? `${newFieldCampaignsBaseUrl}/Lee/instrument-processed-data/Mobile_radar/${iopFolder}/high/tileset.json`
        : null
      return [preferSzgProbeUrl([canonical, layer.highTileLocation, layer.highTileUrls?.[0]])].filter(
        Boolean
      )
    }
    case "nexrad": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      return [
        preferSzgProbeUrl([
          iopFolder && leeSzgInstrumentUrl("NEXRAD", iopFolder, "frames.json"),
          layer.framesJsonUrl,
        ]),
      ].filter(Boolean)
    }
    case "glm": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      return [
        preferSzgProbeUrl([
          iopFolder && leeSzgInstrumentUrl("GLM", iopFolder, "lee_points.json"),
          layer.pointsJsonUrl,
        ]),
      ].filter(Boolean)
    }
    case "efm": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      const flightFile = layer.efmFlights?.[0]?.file
      if (!iopFolder || !flightFile) return []
      return [
        preferSzgProbeUrl([
          leeSzgInstrumentUrl(
            "Balloon_electric_field_meter",
            iopFolder,
            "efm_cesium_outputs",
            flightFile
          ),
          leeEfmCzmlPath(iopFolder, "efm_cesium_outputs", flightFile),
        ]),
      ].filter(Boolean)
    }
    case "soundingCzml": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      const czmlFile = layer.czmlLocation?.split("/").pop() || layer.czmlLocations?.[0]?.split("/").pop()
      const instrumentFolder = layer.shortName?.includes("oswego")
        ? "Oswego_soundings"
        : layer.shortName?.includes("nssl")
          ? "NSSL_Mobile_Sounding"
          : null
      return [
        preferSzgProbeUrl([
          instrumentFolder &&
            iopFolder &&
            czmlFile &&
            leeSzgInstrumentUrl(instrumentFolder, iopFolder, czmlFile),
          layer.czmlLocation || layer.czmlLocations?.[0],
        ]),
      ].filter(Boolean)
    }
    case "lma3dtile": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      return [
        preferSzgProbeUrl([
          iopFolder &&
            leeSzgInstrumentUrl("Combined_LMA", iopFolder, "lee_tileset", "tileset.json"),
          layer.tileLocation,
        ]),
      ].filter(Boolean)
    }
    default:
      return []
  }
}

function parseFramesPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.frames)) return payload.frames
  return []
}

function normalizeFrameTimestamp(frame) {
  return frame?.timestamp || frame?.time || null
}

function parseCzmlClockInterval(payload) {
  const packets = Array.isArray(payload) ? payload : null
  if (!packets?.length) return null

  const documentPacket = packets.find((packet) => packet?.clock?.interval) || packets[0]
  const interval = documentPacket?.clock?.interval
  if (typeof interval !== "string" || !interval.includes("/")) return null

  const [start, end] = interval.split("/")
  if (!start || !end) return null
  return { start, end }
}

function getStaticLeeDatasetTimes(layer) {
  const listingDate = layer?.listingDate || layer?.date
  const instrumentKey =
    LEE_INSTRUMENT_TIME_KEYS[layer?.displayMechanism] ||
    (layer?.shortName?.includes("oswego")
      ? "oswegoSoundings"
      : layer?.shortName?.includes("nssl")
        ? "nsslSoundings"
        : null)

  if (!listingDate || !instrumentKey) return null
  return getLeeLayerDatasetTimes(listingDate, instrumentKey)
}

async function fetchJsonFromProbeUrls(urls) {
  for (const url of urls) {
    try {
      const resp = await fetch(resolveLeeS3Url(url), { cache: "no-store" })
      if (!resp.ok) continue
      return { payload: await resp.json(), url }
    } catch {
      // try next candidate
    }
  }
  return null
}

async function probeNexradDatasetTimes(layer) {
  const urls = getLeeLayerProbeUrls(layer)
  const fetched = await fetchJsonFromProbeUrls(urls)
  if (!fetched) return null

  const frames = parseFramesPayload(fetched.payload)
    .map((frame) => normalizeFrameTimestamp(frame))
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  if (!frames.length) return null
  return { start: frames[0], end: frames[frames.length - 1] }
}

async function probeGlmDatasetTimes(layer) {
  const urls = getLeeLayerProbeUrls(layer)
  const fetched = await fetchJsonFromProbeUrls(urls)
  if (!fetched) return null

  const data = Array.isArray(fetched.payload)
    ? fetched.payload
    : fetched.payload?.points
  if (!Array.isArray(data) || !data.length) return null

  let minTime = Number.POSITIVE_INFINITY
  let maxTime = Number.NEGATIVE_INFINITY

  for (const point of data) {
    const relSec = Number(point?.time)
    if (!Number.isFinite(relSec)) continue
    minTime = Math.min(minTime, relSec)
    maxTime = Math.max(maxTime, relSec)
  }

  if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) return null

  const epochIso = layer.epochIso || layer.start
  if (!epochIso) return null

  const epoch = moment.utc(epochIso)
  return {
    start: epoch.clone().add(minTime, "seconds").toISOString(),
    end: epoch.clone().add(maxTime, "seconds").toISOString(),
    epoch: epochIso,
  }
}

async function probeCzmlDatasetTimes(layer) {
  const urls = getLeeLayerProbeUrls(layer)
  const fetched = await fetchJsonFromProbeUrls(urls)
  if (!fetched) return null
  return parseCzmlClockInterval(fetched.payload)
}

async function probeDow7DatasetTimes(layer) {
  const czmlUrls = [layer.surfaceCzmlLocation, ...(layer.surfaceCzmlUrls || [])].filter(Boolean)
  const fetched = await fetchJsonFromProbeUrls(czmlUrls)
  if (fetched) {
    const czmlTimes = parseCzmlClockInterval(fetched.payload)
    if (czmlTimes) return czmlTimes
  }

  return getStaticLeeDatasetTimes(layer)
}

export async function probeLeeLayerDatasetTimes(layer) {
  if (!layer?.layerId) return null

  const cacheKey = layer.layerId
  if (datasetTimesCache.has(cacheKey)) {
    return datasetTimesCache.get(cacheKey)
  }

  let times = null

  switch (layer.displayMechanism) {
    case "nexrad":
      times = await probeNexradDatasetTimes(layer)
      break
    case "glm":
      times = await probeGlmDatasetTimes(layer)
      break
    case "efm":
    case "soundingCzml":
      times = await probeCzmlDatasetTimes(layer)
      break
    case "dow7":
      times = await probeDow7DatasetTimes(layer)
      break
    default:
      times = getStaticLeeDatasetTimes(layer)
      break
  }

  if (!times?.start || !times?.end) {
    times = getStaticLeeDatasetTimes(layer)
  }

  datasetTimesCache.set(cacheKey, times)
  return times
}

export async function getLeeLayersWithData(layers) {
  const checks = await Promise.all(
    layers.map(async (layer) => {
      const known = getLeeKnownLayerAvailability(layer)
      if (known !== null) {
        return { layerId: layer.layerId, ok: known }
      }

      const urls = getLeeLayerProbeUrls(layer)
      if (!urls.length) {
        return { layerId: layer.layerId, ok: false }
      }

      const ok = await probeFirstAvailableUrl(urls)
      return { layerId: layer.layerId, ok }
    })
  )

  return new Set(checks.filter((entry) => entry.ok).map((entry) => entry.layerId))
}

export function getLeeLayerStaticDatasetTimesMap(layers) {
  const datasetTimesByLayerId = {}

  ;(layers || []).forEach((layer) => {
    const times = getStaticLeeDatasetTimes(layer)
    if (times?.start && times?.end) {
      datasetTimesByLayerId[layer.layerId] = times
    } else if (layer?.start && layer?.end) {
      datasetTimesByLayerId[layer.layerId] = { start: layer.start, end: layer.end }
    }
  })

  return datasetTimesByLayerId
}

/** Lightweight background refresh — skips heavy files like full GLM points.json. */
export async function enrichLeeLayerDatasetTimes(layers) {
  const updates = await Promise.all(
    (layers || []).map(async (layer) => {
      let times = getStaticLeeDatasetTimes(layer)
      if (!times?.start && layer?.start && layer?.end) {
        times = { start: layer.start, end: layer.end }
      }

      try {
        if (layer.displayMechanism === "nexrad") {
          const probed = await probeNexradDatasetTimes(layer)
          if (probed?.start && probed?.end) times = probed
        } else if (layer.displayMechanism === "efm" || layer.displayMechanism === "soundingCzml") {
          const probed = await probeCzmlDatasetTimes(layer)
          if (probed?.start && probed?.end) times = probed
        }
      } catch {
        // keep static / layer defaults
      }

      return { layerId: layer.layerId, times }
    })
  )

  const datasetTimesByLayerId = {}
  updates.forEach((entry) => {
    if (entry.times?.start && entry.times?.end) {
      datasetTimesByLayerId[entry.layerId] = entry.times
    }
  })

  return datasetTimesByLayerId
}

export async function getLeeLayersAvailabilityInfo(layers) {
  const [availableIds, datasetTimesByLayerId] = await Promise.all([
    getLeeLayersWithData(layers),
    Promise.resolve(getLeeLayerStaticDatasetTimesMap(layers)),
  ])

  return { availableIds, datasetTimesByLayerId }
}
