// Shared LEE visualization colors — keep timeline/filter bars aligned with the globe.

export const GLM_INTENSITY_LEGEND = [
  { color: "#4dd2ff", label: "Very Low", range: "0.00 – 0.20" },
  { color: "#ff5c5c", label: "Low", range: "0.20 – 0.40" },
  { color: "#ff9f43", label: "Medium", range: "0.40 – 0.65" },
  { color: "#ffe44d", label: "High", range: "0.65 – 0.85" },
  { color: "#ffffff", label: "Very High", range: "0.85 – 1.00", border: true },
]

export const GLM_INTENSITY_GRADIENT = `linear-gradient(to right, ${GLM_INTENSITY_LEGEND.map(
  (entry) => entry.color
).join(", ")})`

export const DOW7_REFLECTIVITY_LEGEND = [
  { color: "rgb(255, 0, 0)", label: "≥ 40 dBZ Strong echo", lowDbz: false },
  { color: "rgb(255, 120, 0)", label: "30–39 dBZ Moderate/strong", lowDbz: false },
  { color: "rgb(255, 220, 0)", label: "20–29 dBZ Moderate", lowDbz: false },
  { color: "rgb(0, 220, 100)", label: "10–19 dBZ Light echo", lowDbz: false },
  { color: "rgb(0, 180, 255)", label: "< 10 dBZ Very weak echo", lowDbz: true },
  { color: "rgb(60, 80, 255)", label: "< 0 dBZ Weak/noisy return", lowDbz: true },
]

export const DOW7_REFLECTIVITY_GRADIENT =
  "linear-gradient(to right," +
  "rgb(60, 80, 255) 0%," +
  "rgb(0, 180, 255) 18%," +
  "rgb(0, 220, 100) 36%," +
  "rgb(255, 220, 0) 54%," +
  "rgb(255, 120, 0) 72%," +
  "rgb(255, 0, 0) 100%)"

export const NEXRAD_DBZ_GRADIENT =
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
  "#ffffff 100%)"

export const EFM_ALTITUDE_GRADIENT =
  "linear-gradient(to right, rgb(40,100,255), rgb(40,240,255), rgb(255,240,40), rgb(255,50,40))"

/** LMA point color is baked from source power (dBm) via power_to_rgb in the tileset pipeline. */
export const LMA_POWER_LEGEND = [
  { color: "#FFFFFF", label: "Very high", range: "≥ 10", border: true },
  { color: "#FFFF00", label: "High", range: "0 – 10" },
  { color: "#FF8000", label: "Medium", range: "−10 – 0" },
  { color: "#FF0000", label: "Low", range: "−20 – −10" },
]

/** @deprecated use LMA_POWER_LEGEND — color is power (dBm), not altitude */
export const LMA_ALTITUDE_LEGEND = LMA_POWER_LEGEND

export const LMA_ALTITUDE_GRADIENT =
  "linear-gradient(to right, #FF0000 0%, #FF8000 33%, #FFFF00 66%, #FFFFFF 100%)"

export const LMA_POWER_GRADIENT = LMA_ALTITUDE_GRADIENT

export const OSWEGO_SOUNDING_START_COLOR = "#00897b"
export const OSWEGO_SOUNDING_END_COLOR = "#f9a825"

export const NSSL_SOUNDING_START_COLOR = "#c2185b"
export const NSSL_SOUNDING_END_COLOR = "#43a047"

export const OSWEGO_SOUNDING_LEGEND = [
  { color: OSWEGO_SOUNDING_START_COLOR, label: "Oswego Launch (start)" },
  { color: OSWEGO_SOUNDING_END_COLOR, label: "Oswego Landing (end)" },
]

export const NSSL_SOUNDING_LEGEND = [
  { color: NSSL_SOUNDING_START_COLOR, label: "NSSL Launch (start)" },
  { color: NSSL_SOUNDING_END_COLOR, label: "NSSL Landing (end)" },
]

export const OSWEGO_SOUNDING_GRADIENT =
  `linear-gradient(to right, ${OSWEGO_SOUNDING_START_COLOR} 0%, #26c6da 50%, ${OSWEGO_SOUNDING_END_COLOR} 100%)`

export const NSSL_SOUNDING_GRADIENT =
  `linear-gradient(to right, ${NSSL_SOUNDING_START_COLOR} 0%, #ec407a 50%, ${NSSL_SOUNDING_END_COLOR} 100%)`

/** Timeline + layer-list legend entries keyed by layer shortName */
export const LEE_VIZ_LEGENDS = {
  leemobileradar: {
    color: "orangered",
    timelineGradient: DOW7_REFLECTIVITY_GRADIENT,
  },
  leenexrad: {
    color: "mediumseagreen",
    timelineGradient: NEXRAD_DBZ_GRADIENT,
  },
  leeglm: {
    color: "gold",
    timelineGradient: GLM_INTENSITY_GRADIENT,
  },
  leecombinedlma: {
    color: "deepskyblue",
    timelineGradient: LMA_POWER_GRADIENT,
    markerLegend: LMA_POWER_LEGEND,
  },
  leeoswegosoundings: {
    color: OSWEGO_SOUNDING_START_COLOR,
    timelineGradient: OSWEGO_SOUNDING_GRADIENT,
    markerLegend: OSWEGO_SOUNDING_LEGEND,
  },
  leensslmobilesounding: {
    color: NSSL_SOUNDING_START_COLOR,
    timelineGradient: NSSL_SOUNDING_GRADIENT,
    markerLegend: NSSL_SOUNDING_LEGEND,
  },
  leeballoonefm: {
    color: "crimson",
    timelineGradient: EFM_ALTITUDE_GRADIENT,
  },
}
