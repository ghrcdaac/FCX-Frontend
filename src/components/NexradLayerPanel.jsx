import React, { useEffect, useState } from "react"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import Typography from "@material-ui/core/Typography"
import emitter from "../helpers/event"

const DBZ_LABELS = [
  "75", "70", "65", "60", "55", "50",
  "45", "40", "35", "30", "25", "20",
  "15", "10", "5", "0", "-10", "-20",
]

export default function NexradLayerPanel() {
  const [radarCursorEnabled, setRadarCursorEnabled] = useState(true)
  const [frameIndex, setFrameIndex] = useState(-1)
  const [totalFrames, setTotalFrames] = useState(0)
  const [timestamp, setTimestamp] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [frameError, setFrameError] = useState(null)
  const [framesJsonUrl, setFramesJsonUrl] = useState(null)
  const [failedTriedUrls, setFailedTriedUrls] = useState([])
  const [leeDataSubfolders, setLeeDataSubfolders] = useState([])
  const [listingDate, setListingDate] = useState(null)
  const [clockStart, setClockStart] = useState(null)
  const [clockStop, setClockStop] = useState(null)

  useEffect(() => {
    const onState = (state) => {
      if (!state) return

      setRadarCursorEnabled(state.radarCursorEnabled !== false)
      setFrameIndex(state.frameIndex ?? -1)
      setTotalFrames(state.totalFrames ?? 0)
      setTimestamp(state.timestamp ?? null)
      setLoadError(state.loadError ?? null)
      setFrameError(state.frameError ?? null)
      setFramesJsonUrl(state.framesJsonUrl ?? null)
      setFailedTriedUrls(state.failedTriedUrls ? [...state.failedTriedUrls] : [])
      setLeeDataSubfolders(state.leeDataSubfolders ? [...state.leeDataSubfolders] : [])
      setListingDate(state.listingDate ?? null)
      setClockStart(state.clockStart ?? null)
      setClockStop(state.clockStop ?? null)
    }

    emitter.on("nexradStateChange", onState)
    return () => emitter.off("nexradStateChange", onState)
  }, [])

  const handleCursorToggle = (event) => {
    const enabled = event.target.checked
    setRadarCursorEnabled(enabled)
    emitter.emit("nexradCursorChange", enabled)
  }

  const progressPct =
    totalFrames > 1 && frameIndex >= 0
      ? Math.round((frameIndex / (totalFrames - 1)) * 100)
      : frameIndex >= 0
        ? 100
        : 0

  const iopFolder = leeDataSubfolders[0] || "Nov18|Nov19"

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        NEXRAD Reflectivity
      </Typography>

      {(loadError || frameError) && (
        <div style={{ color: "#c62828", marginBottom: 8, fontSize: 11, wordBreak: "break-word" }}>
          {loadError || frameError}
          {framesJsonUrl && (
            <div style={{ marginTop: 4, opacity: 0.9 }}>
              Loaded from: {framesJsonUrl}
            </div>
          )}
          {failedTriedUrls.length > 0 && (
            <div style={{ marginTop: 4, opacity: 0.85 }}>
              {failedTriedUrls.map((url) => (
                <div key={url}>Tried: {url}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            Upload under:
            <div>
              <code>NEXRAD/{iopFolder}/frames.json</code> and{" "}
              <code>frame_00000.png</code> … in the same folder
            </div>
          </div>
        </div>
      )}

      {!loadError && frameIndex >= 0 && (
        <div style={{ marginBottom: 10, fontSize: 11, lineHeight: 1.5 }}>
          {listingDate && (
            <div>
              <b>IOP tab:</b> {listingDate}
              {leeDataSubfolders[0] ? ` (${leeDataSubfolders[0]})` : ""}
            </div>
          )}
          {clockStart && clockStop && (
            <div>
              <b>Clock range (UTC):</b> {clockStart} → {clockStop}
            </div>
          )}
          <div>
            <b>Frame:</b> {frameIndex + 1} / {totalFrames}
          </div>
          <div>
            <b>Progress:</b> {progressPct}%
          </div>
          <div>
            <b>Frame time (UTC):</b> {timestamp || "unknown"}
          </div>
          <div style={{ marginTop: 4, opacity: 0.85 }}>
            Timeline uses UTC. Nov 19 IOP starts just after midnight UTC (evening Nov 18 in US Eastern).
          </div>
        </div>
      )}

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={radarCursorEnabled}
            onChange={handleCursorToggle}
            color="primary"
          />
        }
        label="Radar cursor (lat/lon tooltip)"
        style={{ display: "block", marginBottom: 8 }}
      />

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 6 }}>
          dBZ
        </Typography>

        <div
          style={{
            width: "100%",
            height: 12,
            borderRadius: 6,
            marginBottom: 4,
            background:
              "linear-gradient(to right," +
              "#041b80 0%," +
              "#0046b5 2%," +
              "#0068dc 4%," +
              "#00aaff 7%," +
              "#00d2b4 11%," +
              "#00c85a 16%," +
              "#50e650 22%," +
              "#f0f000 32%," +
              "#ffc800 42%," +
              "#ff9100 52%," +
              "#ff5000 62%," +
              "#e60000 72%," +
              "#be0000 82%," +
              "#dc00dc 92%," +
              "#ffffff 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 8,
            lineHeight: 1.2,
            width: "100%",
            gap: 1,
          }}
        >
          {[...DBZ_LABELS].reverse().map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <Typography variant="caption" display="block" style={{ marginTop: 8, opacity: 0.85 }}>
          Green = light rain · Yellow = moderate · Orange/red = heavy · Purple = extreme
        </Typography>
      </div>
    </div>
  )
}
