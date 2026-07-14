import {
  buildLeeMobileRadarSurfaceCzmlUrls,
  buildLeeMobileRadarTilesetUrls,
} from "../../../../../config"
import {
  getLeeLayerListingTimes,
  LEE_IOP2_PRIMARY_DATE,
  LEE_NOV18_FOLDER,
  resolveThroughDate,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"
import { LEE_S3_DEFAULT_BASE } from "../../../../../config"

// DOW7 tiles live only under Mobile_radar/Nov18/ (high|low/tileset.json + dow7_surface_obs.czml).
export default function mobileRadar(index, listingDate) {
  if (listingDate !== LEE_IOP2_PRIMARY_DATE) return null

  const iopFolders = [LEE_NOV18_FOLDER]
  const dataset = getLeeLayerDatasetTimes(listingDate, "dow7")
  if (!dataset) return null

  const { start, end } = getLeeLayerListingTimes(listingDate, dataset.start, dataset.end)
  const iopFolder = LEE_NOV18_FOLDER
  const highTileLocation = `${LEE_S3_DEFAULT_BASE}/Lee/instrument-processed-data/Mobile_radar/${iopFolder}/high/tileset.json`
  const lowTileLocation = `${LEE_S3_DEFAULT_BASE}/Lee/instrument-processed-data/Mobile_radar/${iopFolder}/low/tileset.json`
  const surfaceCzmlLocation = `${LEE_S3_DEFAULT_BASE}/Lee/instrument-processed-data/Mobile_radar/${iopFolder}/dow7_surface_obs.czml`

  return {
    layerId: `${listingDate}-${index}-mobile-radar`,
    fieldCampaignName: "LEE",
    shortName: "leemobileradar",
    displayName: "DOW7 Mobile Radar",
    variableName: "Radar Reflectivity",
    unit: "dBZ",
    date: listingDate,
    listingDate,
    throughDate: resolveThroughDate(start, end),
    start,
    end,
    clockMultiplier: 60,
    type: "tiles",
    platform: "ground",
    displayMechanism: "dow7",
    highTileUrls: [highTileLocation, ...buildLeeMobileRadarTilesetUrls(iopFolder, "high").filter((url) => url !== highTileLocation)],
    lowTileUrls: [lowTileLocation, ...buildLeeMobileRadarTilesetUrls(iopFolder, "low").filter((url) => url !== lowTileLocation)],
    surfaceCzmlUrls: [surfaceCzmlLocation, ...buildLeeMobileRadarSurfaceCzmlUrls(iopFolder).filter((url) => url !== surfaceCzmlLocation)],
    highTileLocation,
    lowTileLocation,
    surfaceCzmlLocation,
    leeDataSubfolders: iopFolders,
    defaultSelected: false,
    center: {
      lon: -76.026593,
      lat: 43.990895,
      alt: 95.0,
      radius: 62427,
    },
  }
}
