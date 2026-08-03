import React, { useEffect, useState } from "react"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import Typography from "@material-ui/core/Typography"
import Button from "@material-ui/core/Button"
import ButtonGroup from "@material-ui/core/ButtonGroup"
import emitter from "../helpers/event"
import {
  EFM_FLIGHTS,
  EFM_MODES,
  DEFAULT_EFM_VISIBLE_LAYERS,
  applyEfmFlightSelection,
} from "../helpers/efmConstants"

const LAYER_OPTIONS = [
  { key: "path", label: "Path" },
  { key: "points", label: "Points" },
  { key: "dropLines", label: "Drop lines" },
  { key: "labels", label: "Labels" },
  { key: "movingBalloon", label: "Moving balloon" },
]

export default function EfmLayerPanel() {
  const [currentMode, setCurrentMode] = useState("altitude")
  const [flights, setFlights] = useState(EFM_FLIGHTS)
  const [visibleFlights, setVisibleFlights] = useState({})
  const [visibleLayers, setVisibleLayers] = useState({ ...DEFAULT_EFM_VISIBLE_LAYERS })
  const [failedFlights, setFailedFlights] = useState({})
  const [failedFlightUrls, setFailedFlightUrls] = useState({})
  const [efmBaseUrl, setEfmBaseUrl] = useState(null)
  const [leeDataSubfolders, setLeeDataSubfolders] = useState([])

  useEffect(() => {
    const onState = (state) => {
      if (state?.currentMode) setCurrentMode(state.currentMode)
      if (state?.flights?.length) setFlights(state.flights)
      if (state?.visibleFlights) setVisibleFlights({ ...state.visibleFlights })
      if (state?.visibleLayers) setVisibleLayers({ ...state.visibleLayers })
      if (state?.failedFlights) setFailedFlights({ ...state.failedFlights })
      if (state?.failedFlightUrls) setFailedFlightUrls({ ...state.failedFlightUrls })
      if (state?.efmBaseUrl !== undefined) setEfmBaseUrl(state.efmBaseUrl)
      if (state?.leeDataSubfolders) setLeeDataSubfolders([...state.leeDataSubfolders])
    }
    emitter.on("efmStateChange", onState)
    return () => emitter.off("efmStateChange", onState)
  }, [])

  const handleModeChange = (mode) => {
    setCurrentMode(mode)
    emitter.emit("efmModeChange", mode)
  }

  const handleFlightToggle = (key) => (event) => {
    const next = applyEfmFlightSelection(visibleFlights, key, event.target.checked, flights)
    setVisibleFlights(next)
    emitter.emit("efmFlightChange", next)
  }

  const handleLayerToggle = (key) => (event) => {
    const next = { ...visibleLayers, [key]: event.target.checked }
    setVisibleLayers(next)
    emitter.emit("efmLayerChange", next)
  }

  const modeConfig = EFM_MODES[currentMode]
  const hasLoadFailures = Object.keys(failedFlights).length > 0
  const iopFolder = leeDataSubfolders[0] || "Nov18|Nov19"

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        EFM Balloon View
      </Typography>

      <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 6 }}>
        Color Mode
      </Typography>
      <ButtonGroup size="small" style={{ marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(EFM_MODES).map(([mode, config]) => (
          <Button
            key={mode}
            variant={currentMode === mode ? "contained" : "outlined"}
            color={currentMode === mode ? "primary" : "default"}
            onClick={() => handleModeChange(mode)}
            style={{ marginBottom: 4 }}
          >
            {config.label}
          </Button>
        ))}
      </ButtonGroup>

      <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 6 }}>
        Flights
      </Typography>
      {flights.map((flight) => (
        <FormControlLabel
          key={flight.key}
          control={
            <Checkbox
              size="small"
              checked={!!visibleFlights[flight.key]}
              onChange={handleFlightToggle(flight.key)}
              color="primary"
            />
          }
          label={
            failedFlights[flight.key] ? (
              <span style={{ color: "#c62828" }}>{flight.label} (failed to load)</span>
            ) : (
              flight.label
            )
          }
          style={{ display: "block", marginBottom: 2 }}
        />
      ))}

      {hasLoadFailures && (
        <div style={{ color: "#c62828", marginBottom: 8, fontSize: 11, wordBreak: "break-word" }}>
          <div style={{ marginBottom: 4 }}>
            EFM CZML files were not found at the expected S3 paths for this date tab.
          </div>
          {efmBaseUrl && (
            <div style={{ marginBottom: 4 }}>
              Base: {efmBaseUrl}
            </div>
          )}
          {flights.filter((flight) => failedFlightUrls[flight.key]?.length).map((flight) => (
            <div key={flight.key} style={{ marginTop: 4 }}>
              <strong>{flight.label}</strong> tried:
              <div style={{ opacity: 0.9 }}>{failedFlightUrls[flight.key][0]}</div>
            </div>
          ))}
          <div style={{ marginTop: 6 }}>
            Upload under:
            <div>
              <code>Balloon_electric_field_meter/{iopFolder}/{modeConfig.folder}/</code>
            </div>
            <div style={{ marginTop: 4 }}>
              and <code>.../{modeConfig.folder.replace("outputs", "outputs_adc")}/</code> for ADC mode
            </div>
          </div>
        </div>
      )}

      <Typography variant="caption" display="block" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
        Layers
      </Typography>
      {LAYER_OPTIONS.map((layer) => (
        <FormControlLabel
          key={layer.key}
          control={
            <Checkbox
              size="small"
              checked={!!visibleLayers[layer.key]}
              onChange={handleLayerToggle(layer.key)}
              color="primary"
            />
          }
          label={layer.label}
          style={{ display: "block", marginBottom: 2 }}
        />
      ))}

      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 6 }}>
          {modeConfig.legendTitle}
        </Typography>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            marginBottom: 4,
            background:
              "linear-gradient(to right, rgb(40,100,255), rgb(40,240,255), rgb(255,240,40), rgb(255,50,40))",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.8 }}>
          <span>{modeConfig.legendMin}</span>
          <span>{modeConfig.legendMax}</span>
        </div>
      </div>
    </div>
  )
}
