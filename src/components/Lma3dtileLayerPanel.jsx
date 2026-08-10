import React from "react"
import Typography from "@material-ui/core/Typography"

import { LMA_POWER_LEGEND } from "../helpers/leeVizColors"
import PointShapeLegend from "./PointShapeLegend"

export default function Lma3dtileLayerPanel() {
  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        Combined LMA Source Power (dBm)
      </Typography>

      <PointShapeLegend entries={LMA_POWER_LEGEND} shape="square" />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 6,
          rowGap: 4,
          lineHeight: 1.35,
        }}
      >
        {LMA_POWER_LEGEND.map((item, index) => (
          <span
            key={item.label}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 1,
                background: item.color,
                border: item.border || item.color === "#FFFFFF" ? "1px solid #ccc" : "none",
                flexShrink: 0,
              }}
            />
            <span>
              {item.label}
              <span style={{ opacity: 0.75 }}> ({item.range})</span>
              {index < LMA_POWER_LEGEND.length - 1 ? "," : ""}
            </span>
          </span>
        ))}
      </div>

      <Typography variant="caption" display="block" style={{ opacity: 0.75, marginTop: 8 }}>
        Point color is source power (dBm), not altitude.
      </Typography>
    </div>
  )
}
