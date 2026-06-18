import React, { useEffect, useState } from "react"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import Typography from "@material-ui/core/Typography"
import emitter from "../helpers/event"

const LEGEND_ROWS = [
  { color: "rgb(255, 0, 0)", label: "≥ 40 dBZ Strong echo", lowDbz: false },
  { color: "rgb(255, 120, 0)", label: "30–39 dBZ Moderate/strong", lowDbz: false },
  { color: "rgb(255, 220, 0)", label: "20–29 dBZ Moderate", lowDbz: false },
  { color: "rgb(0, 220, 100)", label: "10–19 dBZ Light echo", lowDbz: false },
  { color: "rgb(0, 180, 255)", label: "< 10 dBZ Very weak echo", lowDbz: true },
  { color: "rgb(60, 80, 255)", label: "< 0 dBZ Weak/noisy return", lowDbz: true },
]

export default function Dow7LayerPanel() {
  const [lowDbzVisible, setLowDbzVisible] = useState(false)

  useEffect(() => {
    const onState = (visible) => setLowDbzVisible(!!visible)
    emitter.on("dow7LowDbzState", onState)
    return () => emitter.off("dow7LowDbzState", onState)
  }, [])

  const handleToggle = (event) => {
    const visible = event.target.checked
    setLowDbzVisible(visible)
    emitter.emit("dow7LowDbzChange", visible)
  }

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        DOW7 Reflectivity Legend
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={lowDbzVisible}
            onChange={handleToggle}
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
