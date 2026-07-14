// Shared LEE visualization colors — keep timeline/filter bars aligned with the globe.

export const GLM_INTENSITY_LEGEND = [
  { color: "#4dd2ff", label: "Very Low" },
  { color: "#ff5c5c", label: "Low" },
  { color: "#ff9f43", label: "Medium" },
  { color: "#ffe44d", label: "High" },
  { color: "#ffffff", label: "Very High" },
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

export const LMA_ALTITUDE_LEGEND = [
  { color: "#FFFFFF", label: "Low altitude", border: true },
  { color: "#FFFF00", label: "Mid-low altitude" },
  { color: "#FF8000", label: "Mid-high altitude" },
  { color: "#FF0000", label: "High altitude" },
]

export const LMA_ALTITUDE_GRADIENT =
  "linear-gradient(to right, #FFFFFF 0%, #FFFF00 33%, #FF8000 66%, #FF0000 100%)"

export const OSWEGO_SOUNDING_GRADIENT =
  "linear-gradient(to right, #4a90d9 0%, #e8a838 50%, #d94a4a 100%)"

export const NSSL_SOUNDING_GRADIENT =
  "linear-gradient(to right, #7b68ee 0%, #da70d6 50%, #ff6347 100%)"

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
    timelineGradient: LMA_ALTITUDE_GRADIENT,
  },
  leeoswegosoundings: {
    color: "darkorange",
    timelineGradient: OSWEGO_SOUNDING_GRADIENT,
  },
  leensslmobilesounding: {
    color: "mediumpurple",
    timelineGradient: NSSL_SOUNDING_GRADIENT,
  },
  leeballoonefm: {
    color: "crimson",
    timelineGradient: EFM_ALTITUDE_GRADIENT,
  },
}
