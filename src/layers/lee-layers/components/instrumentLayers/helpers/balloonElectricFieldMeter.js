import { leeEfmBaseUrl } from "../../../../../config"
import {
  EFM_NOV18_FLIGHTS,
  EFM_NOV19_FLIGHTS,
} from "../../../../../helpers/efmConstants"
import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
} from "./leeIop2"

// S3 layout (playground output/ folder omitted on upload):
// Balloon_electric_field_meter/Nov18/efm_cesium_outputs/*.czml
// Balloon_electric_field_meter/Nov19/efm_cesium_outputs/*.czml
const EFM_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    flights: EFM_NOV18_FLIGHTS,
    iopFolder: LEE_NOV18_FOLDER,
    start: "2022-11-18T22:58:12Z",
    end: "2022-11-19T01:39:44Z",
  },
  [LEE_IOP2_THROUGH_DATE]: {
    flights: EFM_NOV19_FLIGHTS,
    iopFolder: LEE_NOV19_FOLDER,
    start: "2022-11-19T01:39:00Z",
    end: "2022-11-19T18:38:39.809000Z",
  },
}

export default function balloonElectricFieldMeter(index, listingDate) {
  const session = EFM_SESSIONS[listingDate]
  if (!session) return null

  return {
    layerId: `${listingDate}-${index}-balloon-efm`,
    fieldCampaignName: "LEE",
    shortName: "leeballoonefm",
    displayName: "Balloon Electric Field Meter (EFM)",
    variableName: "Electric Field",
    date: listingDate,
    listingDate,
    start: session.start,
    end: session.end,
    clockMultiplier: 60,
    type: "instrument",
    platform: "air",
    displayMechanism: "efm",
    efmBaseUrl: leeEfmBaseUrl,
    efmFlights: session.flights,
    leeDataSubfolders: [session.iopFolder],
  }
}
