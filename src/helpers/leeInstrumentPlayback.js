import { JulianDate } from "cesium"
import { getSoundingCzmlClock } from "./soundingCzmlLayerHandler"
import { EFM_FLIGHTS } from "./efmConstants"

function getEfmFlightsForLayer(layer) {
  return layer?.efmFlights?.length ? layer.efmFlights : EFM_FLIGHTS
}

function isoFromJulian(value) {
  if (!value) return null
  if (typeof value === "string") return value
  try {
    return JulianDate.toIso8601(value)
  } catch {
    return null
  }
}

function compareIsoEarliest(a, b) {
  if (!a) return b
  if (!b) return a
  return a < b ? a : b
}

function compareIsoLatest(a, b) {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

function getSoundingDataSources(entry) {
  const refs = entry?.soundingCzmlRefs
  if (refs?.dataSources?.length) return refs.dataSources
  if (refs?.dataSource) return [refs.dataSource]
  if (entry?.cesiumLayerRef?.entities) return [entry.cesiumLayerRef]
  return []
}

/** Resolved UTC playback window from layer metadata + loaded dataset/flight times. */
export function getLeeInstrumentPlaybackWindow(entry) {
  const layer = entry?.layer
  if (!layer) return null

  let startIso = layer.start || null
  let endIso = layer.end || null

  switch (layer.displayMechanism) {
    case "nexrad": {
      const frames = entry?.nexradRefs?.framesMeta
      if (frames?.length) {
        startIso = frames[0].timestamp || startIso
        endIso = frames[frames.length - 1].timestamp || endIso
      }
      break
    }
    case "efm": {
      const flights = getEfmFlightsForLayer(layer).filter(
        (flight) => entry?.efmRefs?.visibleFlights?.[flight.key] !== false
      )
      flights.forEach((flight) => {
        startIso = compareIsoEarliest(startIso, flight.start)
        endIso = compareIsoLatest(endIso, flight.end)
      })
      break
    }
    case "soundingCzml": {
      getSoundingDataSources(entry).forEach((dataSource) => {
        const clock = getSoundingCzmlClock(dataSource)
        if (!clock?.startTime || !clock?.stopTime) return
        startIso = compareIsoEarliest(startIso, isoFromJulian(clock.startTime))
        endIso = compareIsoLatest(endIso, isoFromJulian(clock.stopTime))
      })
      break
    }
    default:
      break
  }

  if (!startIso || !endIso) return null

  return {
    start: JulianDate.fromIso8601(startIso),
    end: JulianDate.fromIso8601(endIso),
    startIso,
    endIso,
  }
}

export function isTimeWithinPlaybackWindow(window, currentTime) {
  if (!window?.start || !window?.end || !currentTime) return true

  return (
    !JulianDate.lessThan(currentTime, window.start) &&
    !JulianDate.greaterThan(currentTime, window.end)
  )
}

export function isInstrumentActiveAtViewerTime(entry, currentTime) {
  const window = getLeeInstrumentPlaybackWindow(entry)
  if (!window) return true
  return isTimeWithinPlaybackWindow(window, currentTime)
}

export function isFlightActiveAtViewerTime(flight, currentTime) {
  if (!flight?.start || !flight?.end || !currentTime) return true

  const start = JulianDate.fromIso8601(flight.start)
  const end = JulianDate.fromIso8601(flight.end)
  return isTimeWithinPlaybackWindow({ start, end }, currentTime)
}
