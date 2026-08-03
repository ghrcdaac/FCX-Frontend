import moment from "moment"
import { getLeeIopClockWindow } from "../layers/lee-layers/components/instrumentLayers/helpers/leeIop2"

function clampPct(value) {
  return Math.min(100, Math.max(0, value))
}

export function formatLeeAvailabilityTimes(start, end) {
  const startMoment = moment.utc(start)
  const endMoment = moment.utc(end)
  const sameClockTime = startMoment.format("HH:mm:ss") === endMoment.format("HH:mm:ss")
  const availabilityFormat =
    sameClockTime || !startMoment.isSame(endMoment, "day")
      ? "YYYY-MM-DD HH:mm:ss"
      : "HH:mm:ss"
  const utcSuffix = availabilityFormat === "YYYY-MM-DD HH:mm:ss" ? " UTC" : ""

  return {
    startLabel: startMoment.format(availabilityFormat),
    endLabel: endMoment.format(availabilityFormat),
    utcSuffix,
  }
}

/** Position a layer's dataset window on the IOP tab timeline (0–100%). */
export function getLeeAvailabilityBarLayout(listingDate, layerStart, layerEnd) {
  const iop = getLeeIopClockWindow(listingDate)
  if (!iop?.start || !iop?.end || !layerStart || !layerEnd) return null

  const iopStart = moment.utc(iop.start)
  const iopEnd = moment.utc(iop.end)
  const dataStart = moment.utc(layerStart)
  const dataEnd = moment.utc(layerEnd)

  const totalMs = iopEnd.diff(iopStart)
  if (totalMs <= 0) return null

  const segmentStart = moment.max(dataStart, iopStart)
  const segmentEnd = moment.min(dataEnd, iopEnd)
  if (!segmentEnd.isAfter(segmentStart)) return null

  const leftPct = clampPct((segmentStart.diff(iopStart) / totalMs) * 100)
  const widthPct = clampPct((segmentEnd.diff(segmentStart) / totalMs) * 100)

  const iopSpansDays = !iopStart.isSame(iopEnd, "day")
  const iopLabelFormat = iopSpansDays ? "MMM D HH:mm" : "HH:mm"

  return {
    leftPct,
    widthPct,
    iopStartLabel: `${iopStart.format(iopLabelFormat)} UTC`,
    iopEndLabel: `${iopEnd.format(iopLabelFormat)} UTC`,
  }
}
