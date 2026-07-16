import { leeOswegoSoundingCzmlPath } from "../../../../../config"
import {
  getLeeDataSubfolders,
  getLeeLayerListingTimes,
  resolveThroughDate,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"

export default function oswegoSoundings(index, listingDate) {
  const iopFolders = getLeeDataSubfolders(listingDate)
  if (!iopFolders.length) return null

  const iopFolder = iopFolders[0]
  const czmlLocation = leeOswegoSoundingCzmlPath(iopFolder)
  if (!czmlLocation) return null

  const dataset = getLeeLayerDatasetTimes(listingDate, "oswegoSoundings")
  if (!dataset) return null

  const { start, end } = getLeeLayerListingTimes(listingDate, dataset.start, dataset.end)

  return {
    layerId: `${listingDate}-${index}-oswego-soundings`,
    fieldCampaignName: "LEE",
    shortName: "leeoswegosoundings",
    displayName: "Oswego Soundings",
    variableName: "Atmospheric Profile",
    date: listingDate,
    listingDate,
    throughDate: resolveThroughDate(start, end),
    start,
    end,
    clockMultiplier: 30,
    useCzmlClock: false,
    type: "instrument",
    platform: "ground",
    displayMechanism: "soundingCzml",
    czmlLocation,
    leeDataSubfolders: iopFolders,
    launchLabel: "Oswego Launch",
    endLabel: "Oswego Landing",
    launchEntityId: "launch_site",
    endEntityId: "landing_site",
    launchMarkerColor: "#00897b",
    endMarkerColor: "#f9a825",
    launch: {
      lon: -76.539,
      lat: 43.455,
      alt: 110,
    },
    cameraOffset: {
      lonDelta: -0.018,
      latDelta: -0.018,
      fixedAlt: 4500,
    },
  }
}
