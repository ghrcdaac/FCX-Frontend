import { leeGlmLeePointsPath } from "../../../../../config"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
  getLeeLayerListingTimes,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"
import { GLM_CLOCK_MULTIPLIER } from "../../../../../helpers/glmConstants"

const GLM_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    iopFolder: LEE_NOV18_FOLDER,
    pointsJsonUrl: leeGlmLeePointsPath(LEE_NOV18_FOLDER),
  },
  [LEE_IOP2_THROUGH_DATE]: {
    iopFolder: LEE_NOV19_FOLDER,
    pointsJsonUrl: leeGlmLeePointsPath(LEE_NOV19_FOLDER),
  },
}

export default function glm(index, listingDate) {
  const session = GLM_SESSIONS[listingDate]
  if (!session) return null

  const dataset = getLeeLayerDatasetTimes(listingDate, "glm")
  const { start, end } = getLeeLayerListingTimes(listingDate, dataset?.start, dataset?.end)

  return {
    layerId: `${listingDate}-${index}-glm`,
    fieldCampaignName: "LEE",
    shortName: "leeglm",
    displayName: "Geostationary Lightning Mapper (GLM)",
    variableName: "Lightning Events",
    unit: "intensity",
    date: listingDate,
    listingDate,
    start,
    end,
    epochIso: dataset?.epoch || start,
    clockMultiplier: GLM_CLOCK_MULTIPLIER,
    type: "instrument",
    platform: "satellite",
    displayMechanism: "glm",
    pointsJsonUrl: session.pointsJsonUrl,
    leeDataSubfolders: [session.iopFolder],
    defaultSelected: false,
  }
}
