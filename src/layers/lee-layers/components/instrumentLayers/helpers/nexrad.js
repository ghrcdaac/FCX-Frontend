import { leeNexradFramesPath } from "../../../../../config"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
} from "./leeIop2"

// S3 layout: NEXRAD/Nov18/frames.json + frame_00000.png (same for Nov19)
const NEXRAD_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    start: "2022-11-18T19:02:00Z",
    end: "2022-11-18T23:59:00Z",
    iopFolder: LEE_NOV18_FOLDER,
    framesJsonUrl: leeNexradFramesPath(LEE_NOV18_FOLDER),
  },
  [LEE_IOP2_THROUGH_DATE]: {
    start: "2022-11-19T00:11:00Z",
    end: "2022-11-19T15:56:00Z",
    iopFolder: LEE_NOV19_FOLDER,
    framesJsonUrl: leeNexradFramesPath(LEE_NOV19_FOLDER),
  },
}

export default function nexrad(index, listingDate) {
  const session = NEXRAD_SESSIONS[listingDate]
  if (!session) return null

  return {
    layerId: `${listingDate}-${index}-nexrad`,
    fieldCampaignName: "LEE",
    shortName: "leenexrad",
    displayName: "NEXRAD",
    variableName: "Radar Reflectivity",
    unit: "dBZ",
    date: listingDate,
    listingDate,
    start: session.start,
    end: session.end,
    clockMultiplier: 60,
    type: "imagery",
    platform: "ground",
    displayMechanism: "nexrad",
    framesJsonUrl: session.framesJsonUrl,
    leeDataSubfolders: [session.iopFolder],
    defaultSelected: listingDate === LEE_IOP2_THROUGH_DATE ? false : undefined,
  }
}
