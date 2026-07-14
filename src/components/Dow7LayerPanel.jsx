import React, { useEffect, useState } from "react"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import Radio from "@material-ui/core/Radio"
import RadioGroup from "@material-ui/core/RadioGroup"
import Typography from "@material-ui/core/Typography"
import emitter from "../helpers/event"

import { DOW7_REFLECTIVITY_LEGEND } from "../helpers/leeVizColors"
import { DOW7_DISPLAY_MODES, DEFAULT_DOW7_DISPLAY_MODE } from "../helpers/dow7Constants"

const LEGEND_ROWS = DOW7_REFLECTIVITY_LEGEND
const DISPLAY_MODE_OPTIONS = Object.values(DOW7_DISPLAY_MODES)

export default function Dow7LayerPanel() {
  const [lowDbzVisible, setLowDbzVisible] = useState(false)
  const [displayMode, setDisplayMode] = useState(DEFAULT_DOW7_DISPLAY_MODE)

  useEffect(() => {
    const onLowDbzState = (visible) => setLowDbzVisible(!!visible)
    const onDisplayModeState = (mode) => {
      if (mode) setDisplayMode(mode)
    }

    emitter.on("dow7LowDbzState", onLowDbzState)
    emitter.on("dow7DisplayModeState", onDisplayModeState)

    return () => {
      emitter.off("dow7LowDbzState", onLowDbzState)
      emitter.off("dow7DisplayModeState", onDisplayModeState)
    }
  }, [])

  const handleLowDbzToggle = (event) => {
    const visible = event.target.checked
    setLowDbzVisible(visible)
    emitter.emit("dow7LowDbzChange", visible)
  }

  const handleDisplayModeChange = (event) => {
    const mode = event.target.value
    setDisplayMode(mode)
    emitter.emit("dow7DisplayModeChange", mode)
  }

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        DOW7 Reflectivity Legend
      </Typography>

      <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 4 }}>
        Display mode
      </Typography>
      <RadioGroup
        value={displayMode}
        onChange={handleDisplayModeChange}
        style={{ marginBottom: 8 }}
      >
        {DISPLAY_MODE_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.key}
            value={option.key}
            control={<Radio size="small" color="primary" />}
            label={option.label}
            style={{ marginBottom: 0 }}
          />
        ))}
      </RadioGroup>
      <Typography variant="caption" display="block" style={{ opacity: 0.75, marginBottom: 8 }}>
        {displayMode === DOW7_DISPLAY_MODES.accumulate.key
          ? "Shows radar scans from the last 30 minutes up to the current timeline time."
          : "Shows all radar scans for the deployment."}
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={lowDbzVisible}
            onChange={handleLowDbzToggle}
            color="primary"
          />
        }
        label="Show low dBZ levels (< 10 dBZ)"
        style={{ marginBottom: 4, alignItems: "flex-start" }}
      />

      <Typography variant="caption" display="block" style={{ opacity: 0.75, marginBottom: 8 }}>
        {lowDbzVisible
          ? "Low dBZ levels are currently visible."
          : "Low dBZ levels are currently hidden."}
      </Typography>

      {LEGEND_ROWS.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            opacity: row.lowDbz && !lowDbzVisible ? 0.35 : 1,
            textDecoration: row.lowDbz && !lowDbzVisible ? "line-through" : "none",
          }}
        >
          <span
            style={{
              width: 20,
              height: 12,
              background: row.color,
              display: "inline-block",
              border: "1px solid rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          />
          <span>{row.label}</span>
        </div>
      ))}

      <div style={{ height: 1, background: "rgba(0,0,0,0.12)", margin: "8px 0" }} />
    </div>
  )
}
