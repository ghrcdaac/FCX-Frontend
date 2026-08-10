import React, { useEffect, useState } from "react"
import Typography from "@material-ui/core/Typography"
import emitter from "../helpers/event"

import { GLM_INTENSITY_LEGEND } from "../helpers/leeVizColors"
import PointShapeLegend from "./PointShapeLegend"

export default function GlmLayerPanel() {
  const [pointCount, setPointCount] = useState(0)

  useEffect(() => {
    const onState = (state) => {
      if (state?.pointCount !== undefined) setPointCount(state.pointCount)
    }

    emitter.on("glmStateChange", onState)
    return () => emitter.off("glmStateChange", onState)
  }, [])

  return (
    <div style={{ fontSize: 12, width: "100%" }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
        GLM Lightning Points
      </Typography>

      {pointCount > 0 && (
        <div style={{ marginBottom: 10, fontSize: 11 }}>
          <b>Points loaded:</b> {pointCount.toLocaleString()}
        </div>
      )}

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <Typography variant="caption" display="block" style={{ fontWeight: 700, marginBottom: 6 }}>
          Intensity
        </Typography>
        <PointShapeLegend entries={GLM_INTENSITY_LEGEND} shape="circle" />
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
          {GLM_INTENSITY_LEGEND.map((item, index) => (
            <span
              key={item.label}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: item.color,
                  border: item.border || item.color === "#ffffff" ? "1px solid #ccc" : "none",
                  flexShrink: 0,
                }}
              />
              <span>
                {item.label}
                {item.range ? (
                  <span style={{ opacity: 0.75 }}> ({item.range})</span>
                ) : null}
                {index < GLM_INTENSITY_LEGEND.length - 1 ? "," : ""}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
