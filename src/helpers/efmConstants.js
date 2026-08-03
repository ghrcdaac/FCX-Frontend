export const EFM_IOP2_START = "2022-11-18T22:58:12Z"
export const EFM_IOP2_END = "2022-11-19T18:39:00Z"

export const EFM_NOV18_FLIGHTS = [
  {
    key: "rust",
    label: "RUST",
    start: "2022-11-18T22:58:12Z",
    end: "2022-11-19T01:39:44Z",
    file: "EFM_20221118_2258_IOP2_WestSmithville_RUST_track.czml",
  },
]

export const EFM_NOV19_FLIGHTS = [
  {
    key: "sleet",
    label: "SLEET",
    start: "2022-11-19T01:39:00Z",
    end: "2022-11-19T18:38:39.809000Z",
    file: "EFM_20221119_0139_IOP2_WestSmithville_SLEET_track.czml",
  },
  {
    key: "graupel",
    label: "GRAUPEL",
    start: "2022-11-19T02:52:00Z",
    end: "2022-11-19T18:34:39Z",
    file: "EFM_20221119_0252_IOP2_WestSmithville_GRAUPEL_track.czml",
  },
]

export const EFM_FLIGHTS = [...EFM_NOV18_FLIGHTS, ...EFM_NOV19_FLIGHTS]

export const EFM_MODES = {
  altitude: {
    label: "Altitude",
    folder: "efm_cesium_outputs",
    legendTitle: "Color by Altitude",
    legendMin: "Low altitude",
    legendMax: "High altitude",
  },
  adc: {
    label: "ADC Voltage",
    folder: "efm_cesium_outputs_adc",
    legendTitle: "Color by Raw ADC Voltage",
    legendMin: "Lower voltage",
    legendMax: "Higher voltage",
  },
}

export const DEFAULT_EFM_VISIBLE_LAYERS = {
  path: true,
  points: true,
  dropLines: false,
  labels: true,
  movingBalloon: true,
}

export function getDefaultEfmVisibleFlights(flights = EFM_FLIGHTS) {
  return flights.reduce((acc, flight) => {
    acc[flight.key] = true
    return acc
  }, {})
}

export function normalizeEfmVisibleFlights(visibleFlights, flights = EFM_FLIGHTS) {
  const normalized = {}
  flights.forEach((flight) => {
    normalized[flight.key] = !!visibleFlights?.[flight.key]
  })
  return normalized
}

export function applyEfmFlightSelection(current, changedKey, checked, flights = EFM_FLIGHTS) {
  const next = normalizeEfmVisibleFlights(current, flights)
  next[changedKey] = checked
  return next
}
