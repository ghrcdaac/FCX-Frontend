import { leeCombinedLmaTilesetPath } from "../../../../../config"
import {
  getLeeDataSubfolders,
  getLeeLayerListingTimes,
  resolveThroughDate,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"

export default function combinedLma(index, listingDate) {
  const iopFolders = getLeeDataSubfolders(listingDate)
  if (!iopFolders.length) return null

  const iopFolder = iopFolders[0]
  const dataset = getLeeLayerDatasetTimes(listingDate, "lma")
  if (!dataset) return null

  const tileLocation = leeCombinedLmaTilesetPath(iopFolder)
  if (!tileLocation) return null

  const { start, end } = getLeeLayerListingTimes(listingDate, dataset.start, dataset.end)

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
