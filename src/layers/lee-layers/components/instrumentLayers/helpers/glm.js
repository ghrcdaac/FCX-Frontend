import { leeGlmLeePointsPath } from "../../../../../config"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
} from "./leeIop2"
import {
  GLM_NOV18_EPOCH,
  GLM_NOV18_START,
  GLM_NOV18_END,
  GLM_NOV19_EPOCH,
  GLM_NOV19_START,
  GLM_NOV19_END,
  GLM_CLOCK_MULTIPLIER,
} from "../../../../../helpers/glmConstants"

const GLM_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    start: GLM_NOV18_START,
    end: GLM_NOV18_END,
    epochIso: GLM_NOV18_EPOCH,
    iopFolder: LEE_NOV18_FOLDER,
    pointsJsonUrl: leeGlmLeePointsPath(LEE_NOV18_FOLDER),
  },
  [LEE_IOP2_THROUGH_DATE]: {
    start: GLM_NOV19_START,
    end: GLM_NOV19_END,
    epochIso: GLM_NOV19_EPOCH,
    iopFolder: LEE_NOV19_FOLDER,
    pointsJsonUrl: leeGlmLeePointsPath(LEE_NOV19_FOLDER),
  },
}

export default function glm(index, listingDate) {
  const session = GLM_SESSIONS[listingDate]
  if (!session) return null

  return {
    layerId: `${listingDate}-${index}-glm`,
    fieldCampaignName: "LEE",
    shortName: "leeglm",
    displayName: "Geostationary Lightning Mapper (GLM)",
    variableName: "Lightning Events",
    unit: "intensity",
    date: listingDate,
    listingDate,
    start: session.start,
    end: session.end,
    epochIso: session.epochIso,
    clockMultiplier: GLM_CLOCK_MULTIPLIER,
    type: "instrument",
    platform: "satellite",
    displayMechanism: "glm",
    pointsJsonUrl: session.pointsJsonUrl,
    leeDataSubfolders: [session.iopFolder],
    defaultSelected: false,
  }
}
