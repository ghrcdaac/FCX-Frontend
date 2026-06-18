import {
  leeMobileRadarSurfaceCzmlPath,
  leeMobileRadarTilesetPath,
} from "../../../../../config"
import {
  getLeeDataSubfolders,
  getLeeIopClockWindow,
  LEE_IOP2_PRIMARY_DATE,
  resolveThroughDate,
} from "./leeIop2"

// S3 layout per IOP tab: Mobile_radar/{Nov18|Nov19|…}/high|low/tileset.json + dow7_surface_obs.czml
// Folder name is derived from the listing date (2022-11-19 → Nov19) — upload only; no layer code changes.
export default function mobileRadar(index, listingDate) {
  const iopFolders = getLeeDataSubfolders(listingDate)
  const clockWindow = getLeeIopClockWindow(listingDate)
  if (!iopFolders.length || !clockWindow) return null

  const iopFolder = iopFolders[0]
  const { start, end } = clockWindow

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
    type: "tiles",
    platform: "ground",
    displayMechanism: "dow7",
    highTileLocation: leeMobileRadarTilesetPath(iopFolder, "high"),
    lowTileLocation: leeMobileRadarTilesetPath(iopFolder, "low"),
    surfaceCzmlLocation: leeMobileRadarSurfaceCzmlPath(iopFolder),
    leeDataSubfolders: iopFolders,
    defaultSelected: listingDate === LEE_IOP2_PRIMARY_DATE ? undefined : false,
    center: {
      lon: -76.026593,
      lat: 43.990895,
      alt: 95.0,
      radius: 62427,
    },
  }
}
