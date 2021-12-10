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
const updateMissionsByTimeline = (missions) => {
  const sortedMissions = sortMissionsByTimeline(missions)
  const t = new Date()
  //const tDate = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate()
  const tDate = t.toISOString().split('T')[0];

  for (let i = 0; i < sortedMissions.length; i++) {
    if (new Date(tDate) >= new Date(sortedMissions[i].timeline)) {
      sortedMissions[i].status = 'Active'
    }
  }
  return sortedMissions
}

const checkLastActiveMission = (updatedMissions) => {
  let activeMissions = []
  for (let i = 0; i < updatedMissions.length; i++) {
    if (updatedMissions[i].status === 'Active') {
      activeMissions.push(updatedMissions[i])
    }
  }
  return activeMissions.pop()
}

export { missionExists, sortMissionsByKey, updateMissionsByTimeline, checkLastActiveMission }
