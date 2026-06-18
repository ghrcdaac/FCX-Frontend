import { leeNsslSoundingCzmlPath } from "../../../../../config"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
} from "./leeIop2"

const NSSL_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    iopFolder: LEE_NOV18_FOLDER,
    files: ["nssl1_225843_sounding_animated.czml"],
    start: "2022-11-18T22:58:43Z",
    end: "2022-11-19T01:39:25Z",
    useCzmlClock: true,
  },
  [LEE_IOP2_THROUGH_DATE]: {
    iopFolder: LEE_NOV19_FOLDER,
    files: [
      "nssl1_013925_sounding_animated.czml",
      "nssl1_025242_sounding_animated.czml",
    ],
    start: "2022-11-19T01:39:25Z",
    end: "2022-11-19T04:00:00Z",
    useCzmlClock: false,
  },
}

function buildNsslCzmlUrls(iopFolder, files) {
  return files.map((file) => leeNsslSoundingCzmlPath(iopFolder, file)).filter(Boolean)
}

export default function nsslMobileSounding(index, listingDate) {
  const session = NSSL_SESSIONS[listingDate]
  if (!session) return null

  const czmlLocations = buildNsslCzmlUrls(session.iopFolder, session.files)

  return {
    layerId: `${listingDate}-${index}-nssl-mobile-sounding`,
    fieldCampaignName: "LEE",
    shortName: "leensslmobilesounding",
    displayName: "NSSL Mobile Sounding",
    variableName: "Atmospheric Profile",
    date: listingDate,
    listingDate,
    start: session.start,
    end: session.end,
    useCzmlClock: session.useCzmlClock,
    launchEntityId: "launch_site",
    type: "instrument",
    platform: "ground",
    displayMechanism: "soundingCzml",
    czmlLocations,
    czmlLocation: czmlLocations[0],
    leeDataSubfolders: [session.iopFolder],
    cameraOffset: {
      lonDelta: -0.025,
      latDelta: -0.025,
      minAlt: 3500,
      altAboveLaunch: 3500,
    },
  }
}
