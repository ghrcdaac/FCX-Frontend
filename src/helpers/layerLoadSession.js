const layerLoadSessions = new Map()

export function startLayerLoad(layerId) {
  if (!layerId) return 0
  const session = (layerLoadSessions.get(layerId) || 0) + 1
  layerLoadSessions.set(layerId, session)
  return session
}

export function cancelLayerLoad(layerId) {
  return startLayerLoad(layerId)
}

export function getLayerLoadSession(layerId) {
  return layerLoadSessions.get(layerId) || 0
}

export function isLayerLoadActive(layerId, session) {
  if (!layerId) return false
  return layerLoadSessions.get(layerId) === session
}
