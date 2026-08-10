import React from "react"

const POINT_OFFSETS = [
  [8, 16],
  [20, 7],
  [32, 21],
  [44, 11],
  [56, 19],
  [68, 5],
  [80, 14],
  [92, 22],
]

export default function PointShapeLegend({ entries, shape = "circle" }) {
  return (
    <div
      aria-label={`${shape} point preview`}
      style={{
        display: "flex",
        width: "100%",
        height: 28,
        marginBottom: 6,
        overflow: "hidden",
      }}
    >
      {entries.map((entry) => (
        <span
          key={entry.label}
          style={{ position: "relative", flex: "1 1 0", minWidth: 42, height: 28 }}
        >
          {POINT_OFFSETS.map(([left, top], index) => (
            <span
              key={index}
              style={{
                position: "absolute",
                left: `${left}%`,
                top,
                width: 5,
                height: 5,
                transform: "translate(-50%, -50%)",
                borderRadius: shape === "circle" ? "50%" : 1,
                background: entry.color,
                border: entry.border ? "1px solid #bbb" : "none",
                boxSizing: "border-box",
              }}
            />
          ))}
        </span>
      ))}
    </div>
  )
}
