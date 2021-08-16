const missionExists = (missionId, missions) => {
  return missions.some(
    element => element['id'] === missionId)
}

export { missionExists }