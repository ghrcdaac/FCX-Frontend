import React from "react"
import { useSelector } from "react-redux"
import moment from "moment"
import { getLayer } from "../helpers/utils"
import Timeline from "../customized-components/react-timeline-9000/src/timeline"
import "../customized-components/react-timeline-9000/src/style.css"
import { CLOCK_END_TIME_BUFFER, CLOCK_START_TIME_BUFFER } from "../constants/cesium/dates"
import { addTimeToISODate } from "../layers/utils/layerDates"
import { getViewer } from "./dock"
import { JulianDate } from "cesium"

const { TIMELINE_MODES } = Timeline

const DEFAULT_LAYER_COLOR = "#4a90d9"

function getLayerLegendColor(layer, campaign) {
  if (layer?.type === "track" && campaign?.legends?.track?.color) {
    return campaign.legends.track.color
  }
  return campaign?.legends?.[layer?.shortName]?.color || DEFAULT_LAYER_COLOR
}

function getLayerTimelineStyle(layer, campaign) {
  const legend = campaign?.legends?.[layer?.shortName]
  if (legend?.timelineGradient) {
    return { background: legend.timelineGradient }
  }
  const color = getLayerLegendColor(layer, campaign)
  return { backgroundColor: color }
}

function getViewerClockRange() {
  const viewer = getViewer()
  if (!viewer || viewer.isDestroyed?.()) {
    return {
      start: moment.utc().subtract(6, "hours"),
      end: moment.utc(),
    }
  }

  const startJSDate = JulianDate.toDate(viewer.clock.startTime)
  const endJSDate = JulianDate.toDate(viewer.clock.stopTime)
  return {
    start: moment.utc(startJSDate),
    end: moment.utc(endJSDate),
  }
}

function FcxTimeline({ campaign }) {
  const state = useSelector((reduxState) => reduxState)

  let startDate
  let endDate
  const selectedItems = []
  const timelineMode = TIMELINE_MODES.SELECT | TIMELINE_MODES.DRAG | TIMELINE_MODES.RESIZE
  const list = []
  const groups = []
  const snap = 1
  const viewerClock = getViewerClockRange()

  for (const [selectedLayerIndex, selectedLayerValue] of state.selectedLayers.entries()) {
    const layer = getLayer(selectedLayerValue, campaign)
    if (!layer) continue

    const viewerStart = layer.start
      ? addTimeToISODate(layer.start, -CLOCK_START_TIME_BUFFER)
      : viewerClock.start.format()
    const viewerEnd = layer.end
      ? addTimeToISODate(layer.end, CLOCK_END_TIME_BUFFER)
      : viewerClock.end.format()
    const candidateStart = moment.utc(viewerStart)
    const candidateEnd = moment.utc(viewerEnd)

    if (!startDate || candidateStart.isBefore(startDate)) {
      startDate = candidateStart
    }
    if (!endDate || candidateEnd.isAfter(endDate)) {
      endDate = candidateEnd
    }

    const color = getLayerLegendColor(layer, campaign)
    const timelineStyle = getLayerTimelineStyle(layer, campaign)
    let start = layer.start ? moment.utc(layer.start) : viewerClock.start.clone()
    let end = layer.end ? moment.utc(layer.end) : viewerClock.end.clone()

    const roundedStartMinutes = Math.floor(start.minute() / snap) * snap
    const roundedEndMinutes = Math.floor(end.minute() / snap) * snap
    start.minute(roundedStartMinutes).second(0)
    end.minute(roundedEndMinutes).second(0)

    const rowIndex = list.length
    groups.push({
      id: rowIndex,
      title: layer.displayName,
    })

    list.push({
      key: `timelineItem${selectedLayerIndex}`,
      title: layer.displayName,
      color,
      timelineStyle,
      row: rowIndex,
      start,
      end,
    })
  }

  if (!startDate || !endDate) {
    startDate = viewerClock.start.clone()
    endDate = viewerClock.end.clone()
  }

  if (!groups.length) {
    groups.push({ id: 0, title: "No layers selected" })
  }

  const rowLayers = []
  for (let i = 0; i < list.length; i += 1) {
    rowLayers.push({
      start: startDate.clone(),
      end: startDate.clone().add(0, "days"),
      style: { ...(list[i].timelineStyle || { backgroundColor: list[i].color }), opacity: "0.15" },
      rowNumber: i,
    })
  }

  return (
    <div className="fcx-timeline-panel">
      <Timeline
        shallowUpdateCheck
        items={list}
        groups={groups}
        startDate={startDate}
        endDate={endDate}
        rowLayers={rowLayers}
        selectedItems={selectedItems}
        timelineMode={timelineMode}
        snapMinutes={snap}
        onItemClick={() => {}}
        onItemDoubleClick={() => {}}
        onItemContextClick={() => {}}
        onInteraction={() => {}}
        onRowClick={() => {}}
        onRowContextClick={() => {}}
        onRowDoubleClick={() => {}}
      />
    </div>
  )
}

export default FcxTimeline
