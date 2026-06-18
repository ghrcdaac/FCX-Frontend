import { leeEfmCzmlPath } from "../config"

export async function probeResourceUrl(url) {
  if (!url) return false

  try {
    const headResp = await fetch(url, { method: "HEAD", cache: "no-store", mode: "cors" })
    if (headResp.ok) return true
  } catch {
    // HEAD may be blocked; fall through to GET probe.
  }

  try {
    const getResp = await fetch(url, {
      method: "GET",
      cache: "no-store",
      mode: "cors",
      headers: { Range: "bytes=0-0" },
    })
    return getResp.ok || getResp.status === 206
  } catch {
    return false
  }
}

export function getLeeLayerProbeUrls(layer) {
  if (!layer) return []

  switch (layer.displayMechanism) {
    case "dow7":
      return [layer.highTileLocation].filter(Boolean)
    case "nexrad":
      return [layer.framesJsonUrl].filter(Boolean)
    case "glm":
      return [layer.pointsJsonUrl].filter(Boolean)
    case "efm": {
      const iopFolder = layer.leeDataSubfolders?.[0]
      const flightFile = layer.efmFlights?.[0]?.file
      if (!iopFolder || !flightFile) return []
      return [leeEfmCzmlPath(iopFolder, "efm_cesium_outputs", flightFile)].filter(Boolean)
    }
    case "soundingCzml":
      return [layer.czmlLocation || layer.czmlLocations?.[0]].filter(Boolean)
    case "lma3dtile":
      return [layer.tileLocation].filter(Boolean)
    default:
      return []
  }
}

export async function getLeeLayersWithData(layerIdsByLayer) {
  const entries = layerIdsByLayer.map((layer) => ({
    layer,
    urls: getLeeLayerProbeUrls(layer),
  }))

  const checks = await Promise.all(
    entries.map(async ({ layer, urls }) => {
      if (!urls.length) {
        return { layerId: layer.layerId, ok: false }
      }

      const results = await Promise.all(urls.map((url) => probeResourceUrl(url)))
      return { layerId: layer.layerId, ok: results.every(Boolean) }
    })
  )

  return new Set(checks.filter((entry) => entry.ok).map((entry) => entry.layerId))
}
