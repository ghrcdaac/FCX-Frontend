import { JulianDate } from "cesium"
import {
  syncNexradAtViewerTime,
  setNexradLayerVisible,
} from "./nexradLayerHandler"
import { syncGlmAtViewerTime, setGlmLayerVisible } from "./glmLayerHandler"
import { syncDow7MultiLayerVisibility, syncDow7TemporalAtViewerTime } from "./dow7LayerHandler"
import { syncEfmAtViewerTime } from "./efmLayerHandler"
import { syncSoundingCzmlAtViewerTime } from "./soundingCzmlLayerHandler"
import { isInstrumentActiveAtViewerTime } from "./leeInstrumentPlayback"

function setLmaVisible(entry, visible) {
  const tileset = entry?.lma3dtileRefs?.tileset || entry?.cesiumLayerRef
  if (tileset) tileset.show = visible
}

export function syncLeeInstrumentEntryAtViewerTime(viewer, entry, activeEntries) {
  if (!viewer || viewer.isDestroyed?.() || !entry?.layer) return
  if (entry.layer.fieldCampaignName !== "LEE") return

  const currentTime = viewer.clock.currentTime
  const active = isInstrumentActiveAtViewerTime(entry, currentTime)

  switch (entry.layer.displayMechanism) {
    case "nexrad":
      if (entry.nexradRefs) {
        if (active) {
          syncNexradAtViewerTime(viewer, entry.nexradRefs, entry.layer)
          setNexradLayerVisible(entry.nexradRefs, true)
        } else {
          setNexradLayerVisible(entry.nexradRefs, false)
        }
      }
      break
    case "glm":
      if (entry.glmRefs) {
        if (active) {
          syncGlmAtViewerTime(viewer, entry.glmRefs, entry.layer)
          setGlmLayerVisible(entry.glmRefs, true)
        } else {
          setGlmLayerVisible(entry.glmRefs, false)
        }
      }
      break
    case "dow7":
      if (entry.dow7Refs?.highDbzTileset) {
        const { highDbzTileset, lowDbzTileset, getLowTileset, surfaceObs } = entry.dow7Refs
        const lowTileset = getLowTileset?.() || lowDbzTileset
        const show = active

        if (highDbzTileset) highDbzTileset.show = show
        if (lowTileset) {
          lowTileset.show = show && entry.dow7Refs.dow7Prefs?.lowDbzVisible === true
        }
        if (surfaceObs) surfaceObs.show = show

        if (show) {
          syncDow7MultiLayerVisibility(viewer, activeEntries)
          syncDow7TemporalAtViewerTime(viewer, entry.dow7Refs)
        }
      }
      break
    case "lma3dtile":
      setLmaVisible(entry, active)
      break
    case "efm":
      if (entry.efmRefs) {
        syncEfmAtViewerTime(viewer, entry)
      }
      break
    case "soundingCzml":
      syncSoundingCzmlAtViewerTime(viewer, entry, active)
      break
    default:
      break
  }
}

export function syncLeeInstrumentsAtViewerTime(viewer, activeEntries) {
  if (!viewer || viewer.isDestroyed?.()) return

  const leeEntries = (activeEntries || []).filter(
    (entry) => entry?.layer?.fieldCampaignName === "LEE"
  )
  if (!leeEntries.length) return

  leeEntries.forEach((entry) => {
    syncLeeInstrumentEntryAtViewerTime(viewer, entry, activeEntries)
  })

  viewer.scene.requestRender()
}

export function registerLeeInstrumentClockSync(viewer, getActiveEntries, syncState) {
  if (!viewer || viewer.isDestroyed?.()) return

  unregisterLeeInstrumentClockSync(viewer, syncState)

  const resolveEntries = () =>
    typeof getActiveEntries === "function" ? getActiveEntries() : getActiveEntries

  const leeCount = (resolveEntries() || []).filter(
    (entry) => entry?.layer?.fieldCampaignName === "LEE"
  ).length

  if (leeCount < 2) return

  const syncAll = () => {
    if (viewer.isDestroyed?.()) return
    syncLeeInstrumentsAtViewerTime(viewer, resolveEntries())
  }

  syncState.handler = viewer.clock.onTick.addEventListener(syncAll)

  if (viewer.timeline && viewer.timeline.addEventListener) {
    syncState.timelineHandler = viewer.timeline.addEventListener("settime", syncAll)
  }

  syncAll()
}

export function unregisterLeeInstrumentClockSync(viewer, syncState) {
  if (!viewer || viewer.isDestroyed?.()) {
    if (syncState) {
      syncState.handler = null
      syncState.timelineHandler = null
    }
    return
  }

  if (syncState?.handler) {
    try {
      viewer.clock.onTick.removeEventListener(syncState.handler)
    } catch {
      // ignore cleanup errors
    }
    syncState.handler = null
  }

  if (syncState?.timelineHandler && viewer.timeline?.removeEventListener) {
    try {
      viewer.timeline.removeEventListener(syncState.timelineHandler)
    } catch {
      // ignore cleanup errors
    }
    syncState.timelineHandler = null
  }
}
