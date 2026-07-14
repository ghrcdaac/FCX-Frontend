import { leeNexradFramesPath } from "../../../../../config"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
  getLeeLayerListingTimes,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"

const NEXRAD_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    iopFolder: LEE_NOV18_FOLDER,
    framesJsonUrl: leeNexradFramesPath(LEE_NOV18_FOLDER),
  },
  [LEE_IOP2_THROUGH_DATE]: {
    iopFolder: LEE_NOV19_FOLDER,
    framesJsonUrl: leeNexradFramesPath(LEE_NOV19_FOLDER),
  },
}

export default function nexrad(index, listingDate) {
  const session = NEXRAD_SESSIONS[listingDate]
  if (!session) return null

  const dataset = getLeeLayerDatasetTimes(listingDate, "nexrad")
  const { start, end } = getLeeLayerListingTimes(listingDate, dataset?.start, dataset?.end)

  return {
    layerId: `${listingDate}-${index}-nexrad`,
    fieldCampaignName: "LEE",
    shortName: "leenexrad",
    displayName: "NEXRAD",
    variableName: "Radar Reflectivity",
    unit: "dBZ",
    date: listingDate,
    listingDate,
    start,
    end,
    clockMultiplier: 60,
    type: "imagery",
    platform: "ground",
    displayMechanism: "nexrad",
    framesJsonUrl: session.framesJsonUrl,
    leeDataSubfolders: [session.iopFolder],
    defaultSelected: listingDate === LEE_IOP2_THROUGH_DATE ? false : undefined,
  }
}
