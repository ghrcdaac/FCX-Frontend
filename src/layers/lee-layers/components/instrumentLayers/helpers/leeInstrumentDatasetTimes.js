import {
  LEE_IOP2_PRIMARY_DATE,
  LEE_IOP2_THROUGH_DATE,
  LEE_NOV18_FOLDER,
  LEE_NOV19_FOLDER,
} from "./leeIop2"

/**
 * Per-instrument UTC windows derived from uploaded S3 datasets
 * (tileset scan names, frames.json, CZML / flight metadata).
 */
export const LEE_INSTRUMENT_DATASET_TIMES = {
  dow7: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T18:58:16Z",
      end: "2022-11-19T06:02:54Z",
    },
  },
  nexrad: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T19:02:00Z",
      end: "2022-11-18T23:59:00Z",
    },
    [LEE_NOV19_FOLDER]: {
      start: "2022-11-19T00:11:00Z",
      end: "2022-11-19T15:56:00Z",
    },
  },
  glm: {
    [LEE_NOV18_FOLDER]: {
      epoch: "2022-11-18T00:00:00Z",
      start: "2022-11-18T19:00:00Z",
      end: "2022-11-19T06:00:00Z",
    },
    [LEE_NOV19_FOLDER]: {
      epoch: "2022-11-19T00:00:00Z",
      start: "2022-11-19T00:11:00Z",
      end: "2022-11-19T15:56:00Z",
    },
  },
  lma: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T18:58:16Z",
      end: "2022-11-19T06:02:54Z",
    },
    [LEE_NOV19_FOLDER]: {
      start: "2022-11-19T00:11:00Z",
      end: "2022-11-19T15:56:00Z",
    },
  },
  efm: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T22:58:12Z",
      end: "2022-11-19T01:39:44Z",
    },
    [LEE_NOV19_FOLDER]: {
      start: "2022-11-19T01:39:00Z",
      end: "2022-11-19T18:38:39Z",
    },
  },
  oswegoSoundings: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T23:57:00Z",
      end: "2022-11-19T01:20:00Z",
    },
  },
  nsslSoundings: {
    [LEE_NOV18_FOLDER]: {
      start: "2022-11-18T22:58:43Z",
      end: "2022-11-19T01:39:25Z",
    },
    [LEE_NOV19_FOLDER]: {
      start: "2022-11-19T01:39:25Z",
      end: "2022-11-19T04:00:00Z",
    },
  },
}

const LISTING_TO_IOP_FOLDER = {
  [LEE_IOP2_PRIMARY_DATE]: LEE_NOV18_FOLDER,
  [LEE_IOP2_THROUGH_DATE]: LEE_NOV19_FOLDER,
}

export function getLeeInstrumentDatasetWindow(instrumentKey, listingDate) {
  const iopFolder = LISTING_TO_IOP_FOLDER[listingDate]
  if (!instrumentKey || !iopFolder) return null
  return LEE_INSTRUMENT_DATASET_TIMES[instrumentKey]?.[iopFolder] || null
}

export function getLeeLayerDatasetTimes(listingDate, instrumentKey, fallbackStart, fallbackEnd) {
  const dataset = getLeeInstrumentDatasetWindow(instrumentKey, listingDate)
  if (dataset?.start && dataset?.end) {
    return { start: dataset.start, end: dataset.end, epoch: dataset.epoch }
  }
  if (fallbackStart && fallbackEnd) {
    return { start: fallbackStart, end: fallbackEnd }
  }
  return null
}
