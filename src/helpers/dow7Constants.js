export const DOW7_DISPLAY_MODES = {
  accumulate: { key: "accumulate", label: "30 min" },
  full: { key: "full", label: "Full" },
}

export const DEFAULT_DOW7_DISPLAY_MODE = "accumulate"

/** Keep scans from this many seconds before the viewer clock (accumulate mode). */
export const DOW7_ACCUMULATE_WINDOW_SEC = 30 * 60
