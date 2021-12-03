import { cloneDeep } from "lodash"

const missionExists = (missions, missionId) => {
  return missions.some(
    element => element['id'] === missionId)
}

const sortMissionsByKey = (missions, key="priority") => {
  const sortedMission = cloneDeep(missions)
  return sortedMission.sort((obj1, obj2) => (
    obj1[key] === obj2[key] ? 0 :
    obj1[key] > obj2[key]   ? 1 :
                             -1
  ))
}

const sortMissionsByTimeline = (missions) => {
  const sortedMission = cloneDeep(missions)
  return sortedMission.sort((a, b) => (
    new Date(a.timeline).getTime() - new Date(b.timeline).getTime()
  ))
}

const compareMissionsByTimeline = (timeline) => {
  const t = new Date()
  //const tDate = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate()
  const tDate = t.toISOString().split('T')[0];

  if (new Date(tDate) >= new Date(timeline)) {
    return true
  }
  else {
    return false
  }
}

export { missionExists, sortMissionsByKey, sortMissionsByTimeline, compareMissionsByTimeline }