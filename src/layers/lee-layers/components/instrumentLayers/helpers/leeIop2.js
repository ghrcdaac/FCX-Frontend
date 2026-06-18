// IOP 2 (West Smithville): evening Nov 18 through morning Nov 19 UTC.
export const LEE_IOP2_PRIMARY_DATE = "2022-11-18"
export const LEE_IOP2_THROUGH_DATE = "2022-11-19"

/**
 * Shared S3/local IOP subfolders under each LEE instrument (same pattern as GLM).
 * e.g. GLM/Nov18/lee_points.json, Balloon_electric_field_meter/Nov19/efm_cesium_outputs/
 */
export const LEE_NOV18_FOLDER = "Nov18"
export const LEE_NOV19_FOLDER = "Nov19"
export const LEE_EFM_OUTPUT_FOLDER = "output"
export const LEE_GLM_POINTS_FILE = "lee_points.json"
export const LEE_IOP2_END = "2022-11-19T06:00:00Z"
export const LEE_EFM_IOP2_START = "2022-11-18T22:58:12Z"
export const LEE_EFM_IOP2_END = "2022-11-19T18:39:00Z"

/** Nov19 tab is shown; instruments without uploaded data are hidden in the layer list. */
export const LEE_IOP2_ENABLE_NOV19_TAB = true

export const LEE_IOP2_LISTING_DATES = LEE_IOP2_ENABLE_NOV19_TAB
  ? [LEE_IOP2_PRIMARY_DATE, LEE_IOP2_THROUGH_DATE]
  : [LEE_IOP2_PRIMARY_DATE]

const LEE_IOP_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** Derive S3 IOP folder from listing date, e.g. 2022-11-19 → Nov19 */
export function getLeeIopFolderFromListingDate(listingDate) {
  if (!listingDate || !/^\d{4}-\d{2}-\d{2}$/.test(listingDate)) return null

  const [, monthStr, dayStr] = listingDate.split("-")
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)

  if (monthIndex < 0 || monthIndex > 11 || !Number.isFinite(day) || day < 1 || day > 31) {
    return null
  }

  return `${LEE_IOP_MONTHS[monthIndex]}${day}`
}

export function getLeeDataSubfolders(listingDate) {
  if (!LEE_IOP2_LISTING_DATES.includes(listingDate)) return []

  const folder = getLeeIopFolderFromListingDate(listingDate)
  return folder ? [folder] : []
}

const LEE_IOP_CLOCK_OVERRIDES = {
  [LEE_IOP2_PRIMARY_DATE]: {
    start: "2022-11-18T19:00:00Z",
    end: LEE_IOP2_END,
  },
  [LEE_IOP2_THROUGH_DATE]: {
    start: "2022-11-19T00:11:00Z",
    end: LEE_EFM_IOP2_END,
  },
}

/** Timeline window for an IOP tab; falls back to full UTC listing day when not overridden. */
export function getLeeIopClockWindow(listingDate) {
  if (LEE_IOP_CLOCK_OVERRIDES[listingDate]) {
    return LEE_IOP_CLOCK_OVERRIDES[listingDate]
  }

  if (!LEE_IOP2_LISTING_DATES.includes(listingDate)) return null

  return {
    start: `${listingDate}T00:00:00Z`,
    end: `${listingDate}T23:59:59Z`,
  }
}

export function usesLeeNov19DataPath(layer) {
  return (layer?.leeDataSubfolders || []).length > 0
}

function calendarDay(isoDateTime) {
  return isoDateTime.slice(0, 10)
}

/** List under the start calendar day when a layer spans midnight. */
export function resolveListingDate(start, end) {
  const startDay = calendarDay(start)
  const endDay = calendarDay(end)
  if (startDay === endDay) return startDay
  return startDay
}

/** Set only when the layer spans into a later calendar day (still listed on start day). */
export function resolveThroughDate(start, end) {
  const startDay = calendarDay(start)
  const endDay = calendarDay(end)
  if (startDay !== endDay) return endDay
  return undefined
}
