export const GLM_DISPLAY_MODES = {
  instant: { key: "instant", label: "Instant" },
  accumulate: { key: "accumulate", label: "Accumulate" },
  fullDay: { key: "fullDay", label: "Full Day" },
}

export const DEFAULT_GLM_DISPLAY_MODE = "fullDay"

export const GLM_NOV18_EPOCH = "2022-11-18T00:00:00Z"
export const GLM_NOV18_START = "2022-11-18T00:00:00Z"
export const GLM_NOV18_END = "2022-11-18T23:59:59Z"

export const GLM_NOV19_EPOCH = "2022-11-19T00:00:00Z"
export const GLM_NOV19_START = "2022-11-19T00:00:00Z"
export const GLM_NOV19_END = "2022-11-19T23:59:59Z"

/** @deprecated use GLM_NOV18_* / GLM_NOV19_* per listing date */
export const GLM_IOP2_EPOCH = GLM_NOV18_EPOCH
export const GLM_IOP2_START = GLM_NOV18_START
export const GLM_IOP2_END = "2022-11-19T23:59:59Z"

export const GLM_CLOCK_MULTIPLIER = 120
