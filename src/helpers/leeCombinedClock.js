import { JulianDate, ClockRange } from "cesium"
import { getLeeIopClockWindow } from "../layers/lee-layers/components/instrumentLayers/helpers/leeIop2"
import { getLeeInstrumentPlaybackWindow } from "./leeInstrumentPlayback"

export function getLeeLayerTimeWindow(layer) {
  if (!layer?.start || !layer?.end) return null

  return {
    start: JulianDate.fromIso8601(layer.start),
    end: JulianDate.fromIso8601(layer.end),
    multiplier: layer.clockMultiplier ?? 60,
  }
}

export function pickLeeLayersOnListingDate(activeEntries, listingDate) {
  return (activeEntries || []).filter(
    (entry) =>
      entry?.layer?.fieldCampaignName === "LEE" &&
      (entry.layer.listingDate || entry.layer.date) === listingDate
  )
}

export function isLayerActiveAtViewerTime(layer, currentTime) {
  const window = getLeeLayerTimeWindow(layer)
  if (!window || !currentTime) return true

  return (
    !JulianDate.lessThan(currentTime, window.start) &&
    !JulianDate.greaterThan(currentTime, window.end)
  )
}

export function layerSpansPastListingDay(layer) {
  if (!layer?.start || !layer?.end) return false
  const listingDay = (layer.listingDate || layer.date || layer.start).slice(0, 10)
  return layer.end.slice(0, 10) > listingDay
}

export function shouldPreferLeeUnionClock(activeEntries, listingDate) {
  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  return leeOnDate.length >= 2
}

export function shouldUseLeeDatasetClock(activeEntries, listingDate) {
  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  if (!leeOnDate.length) return false
  if (leeOnDate.length >= 2) return true
  return layerSpansPastListingDay(leeOnDate[0].layer)
}

function pickLeeClockMultiplier(entries) {
  const multipliers = (entries || [])
    .map((entry) => entry?.layer?.clockMultiplier)
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!multipliers.length) return 60
  return Math.max(...multipliers)
}

/** Latest start and earliest end across active LEE layers on one IOP tab. */
export function getLeeLayersOverlapWindow(activeEntries, listingDate) {
  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  if (leeOnDate.length < 2) return null

  let start = null
  let end = null

  leeOnDate.forEach((entry) => {
    const window = getLeeLayerTimeWindow(entry.layer)
    if (!window) return
    if (!start || JulianDate.greaterThan(window.start, start)) {
      start = window.start.clone()
    }
    if (!end || JulianDate.lessThan(window.end, end)) {
      end = window.end.clone()
    }
  })

  if (!start || !end || !JulianDate.lessThan(start, end)) return null
  return { start, end }
}

function applyViewerClockWindow(viewer, start, end, multiplier) {
  viewer.automaticallyTrackDataSourceClocks = false
  viewer.clock.startTime = start.clone()
  viewer.clock.stopTime = end.clone()

  if (
    JulianDate.lessThan(viewer.clock.currentTime, start) ||
    JulianDate.greaterThan(viewer.clock.currentTime, end)
  ) {
    viewer.clock.currentTime = start.clone()
  }

  viewer.clock.multiplier = multiplier
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(start, end)
  }
}

/** Union of active LEE layer dataset windows on one IOP tab. */
export function applyLeeLayersUnionClock(viewer, activeEntries, listingDate) {
  if (!viewer || viewer.isDestroyed?.()) return false

  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  if (!leeOnDate.length) return false

  let start = null
  let end = null

  leeOnDate.forEach((entry) => {
    const playback = getLeeInstrumentPlaybackWindow(entry)
    const window = playback
      ? { start: playback.start, end: playback.end }
      : getLeeLayerTimeWindow(entry.layer)
    if (!window) return
    if (!start || JulianDate.lessThan(window.start, start)) {
      start = window.start.clone()
    }
    if (!end || JulianDate.greaterThan(window.end, end)) {
      end = window.end.clone()
    }
  })

  if (!start || !end) return false

  applyViewerClockWindow(viewer, start, end, pickLeeClockMultiplier(leeOnDate))
  return true
}

/** Shared window where every active LEE layer has data. */
export function applyLeeLayersOverlapClock(viewer, activeEntries, listingDate) {
  if (!viewer || viewer.isDestroyed?.()) return false

  const overlap = getLeeLayersOverlapWindow(activeEntries, listingDate)
  if (!overlap) return false

  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  applyViewerClockWindow(
    viewer,
    overlap.start,
    overlap.end,
    pickLeeClockMultiplier(leeOnDate)
  )
  return true
}

/** Apply the shared IOP tab clock (e.g. Nov18 00:00 – Nov19 06:00 UTC). */
export function applyLeeIopViewerClock(viewer, listingDate) {
  if (!viewer || viewer.isDestroyed?.()) return false

  const iopWindow = getLeeIopClockWindow(listingDate)
  if (!iopWindow) return false

  const start = JulianDate.fromIso8601(iopWindow.start)
  const end = JulianDate.fromIso8601(iopWindow.end)

  viewer.clock.startTime = start.clone()
  viewer.clock.stopTime = end.clone()
  viewer.clock.currentTime = start.clone()
  viewer.clock.multiplier = 60
  viewer.clock.shouldAnimate = true
  viewer.clock.clockRange = ClockRange.LOOP_STOP

  if (viewer.timeline) {
    viewer.timeline.zoomTo(start, end)
  }

  return true
}

/** Union dataset clocks when multiple LEE instruments are active on the same tab. */
export function applyCombinedLeeLayersClock(viewer, activeEntries, listingDate) {
  if (!viewer || viewer.isDestroyed?.()) return false

  const leeOnDate = pickLeeLayersOnListingDate(activeEntries, listingDate)
  if (!leeOnDate.length) return false

  if (leeOnDate.length >= 2) {
    return applyLeeLayersUnionClock(viewer, activeEntries, listingDate)
  }

  const entry = leeOnDate[0]
  const playback = getLeeInstrumentPlaybackWindow(entry)
  const window = playback
    ? {
        start: playback.start,
        end: playback.end,
        multiplier: entry.layer?.clockMultiplier ?? 60,
      }
    : getLeeLayerTimeWindow(entry.layer)
  if (!window) return false

  applyViewerClockWindow(viewer, window.start, window.end, window.multiplier)
  return true
}
