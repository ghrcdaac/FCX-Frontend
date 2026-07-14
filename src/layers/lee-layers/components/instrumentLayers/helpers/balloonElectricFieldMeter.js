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
  getLeeLayerListingTimes,
} from "./leeIop2"
import { getLeeLayerDatasetTimes } from "./leeInstrumentDatasetTimes"

const EFM_SESSIONS = {
  [LEE_IOP2_PRIMARY_DATE]: {
    flights: EFM_NOV18_FLIGHTS,
    iopFolder: LEE_NOV18_FOLDER,
  },
  [LEE_IOP2_THROUGH_DATE]: {
    flights: EFM_NOV19_FLIGHTS,
    iopFolder: LEE_NOV19_FOLDER,
  },
}

export default function balloonElectricFieldMeter(index, listingDate) {
  const session = EFM_SESSIONS[listingDate]
  if (!session) return null

  const dataset = getLeeLayerDatasetTimes(listingDate, "efm")
  const { start, end } = getLeeLayerListingTimes(listingDate, dataset?.start, dataset?.end)

  return {
    layerId: `${listingDate}-${index}-balloon-efm`,
    fieldCampaignName: "LEE",
    shortName: "leeballoonefm",
    displayName: "Balloon Electric Field Meter (EFM)",
    variableName: "Electric Field",
    date: listingDate,
    listingDate,
    start,
    end,
    clockMultiplier: 60,
    type: "instrument",
    platform: "air",
    displayMechanism: "efm",
    efmBaseUrl: leeEfmBaseUrl,
    efmFlights: session.flights,
    leeDataSubfolders: [session.iopFolder],
  }
}
