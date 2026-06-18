import { leeCombinedLmaTilesetPath } from "../../../../../config"
import {
  getLeeDataSubfolders,
  LEE_IOP2_END,
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  resolveThroughDate,
} from "./leeIop2"

// S3 layout: Combined_LMA/{Nov18|Nov19}/lee_tileset/tileset.json
const LMA_CLOCK_WINDOWS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    start: "2022-11-18T00:00:00Z",
    end: LEE_IOP2_END,
  },
  [LEE_IOP2_THROUGH_DATE]: {
    start: "2022-11-19T00:00:00Z",
    end: "2022-11-19T23:59:59Z",
  },
}

export default function combinedLma(index, listingDate) {
  const iopFolders = getLeeDataSubfolders(listingDate)
  const clockWindow = LMA_CLOCK_WINDOWS[listingDate]
  if (!iopFolders.length || !clockWindow) return null

  const iopFolder = iopFolders[0]
  const tileLocation = leeCombinedLmaTilesetPath(iopFolder)
  if (!tileLocation) return null

  const { start, end } = clockWindow

  return {
    layerId: `${listingDate}-${index}-combined-lma`,
    fieldCampaignName: "LEE",
    shortName: "leecombinedlma",
    displayName: "Combined LMA",
    variableName: "Lightning Events",
    date: listingDate,
    listingDate,
    throughDate: resolveThroughDate(start, end),
    start,
    end,
    type: "tiles",
    platform: "ground",
    displayMechanism: "lma3dtile",
    tileLocation,
    leeDataSubfolders: iopFolders,
  }
}
