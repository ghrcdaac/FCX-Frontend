import React from "react"
import Typography from "@material-ui/core/Typography"
import {
  OSWEGO_SOUNDING_LEGEND,
  NSSL_SOUNDING_LEGEND,
} from "../helpers/leeVizColors"

function getLegendRows(shortName) {
  if (shortName === "leeoswegosoundings") return OSWEGO_SOUNDING_LEGEND
  if (shortName === "leensslmobilesounding") return NSSL_SOUNDING_LEGEND
  return []
}

function getTitle(shortName) {
  if (shortName === "leeoswegosoundings") return "Oswego Sounding Markers"
  if (shortName === "leensslmobilesounding") return "NSSL Sounding Markers"
  return "Sounding Markers"
}

export default function SoundingLayerPanel({ shortName }) {
  const rows = getLegendRows(shortName)
  if (!rows.length) return null

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        {getTitle(shortName)}
      </Typography>

      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: row.color,
              border: "2px solid #fff",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: row.color, fontWeight: 600 }}>{row.label}</span>
        </div>
      ))}

      <Typography variant="caption" display="block" style={{ opacity: 0.75, marginTop: 4 }}>
        Start and end markers use different colors on the globe.
      </Typography>
    </div>
  )
}
