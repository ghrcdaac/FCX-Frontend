import React, { useEffect, useState } from "react"
import Typography from "@material-ui/core/Typography"
import emitter from "../helpers/event"

import { GLM_INTENSITY_LEGEND } from "../helpers/leeVizColors"

const INTENSITY_LEGEND = GLM_INTENSITY_LEGEND

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
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {INTENSITY_LEGEND.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: item.color,
                  border: item.color === "#ffffff" ? "1px solid #ccc" : "none",
                  flexShrink: 0,
                }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
