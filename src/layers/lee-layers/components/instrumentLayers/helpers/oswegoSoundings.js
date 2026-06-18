import { leeOswegoSoundingCzmlPath } from "../../../../../config"
import { getLeeDataSubfolders, resolveThroughDate } from "./leeIop2"

// S3 layout: Oswego_soundings/Nov18/oswego_animated.czml (Nov19 when uploaded)
export default function oswegoSoundings(index, listingDate) {
  const iopFolders = getLeeDataSubfolders(listingDate)
  if (!iopFolders.length) return null

  const iopFolder = iopFolders[0]
  const czmlLocation = leeOswegoSoundingCzmlPath(iopFolder)
  if (!czmlLocation) return null

  const start = "2022-11-18T23:57:00Z"
  const end = "2022-11-19T01:20:00Z"

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
