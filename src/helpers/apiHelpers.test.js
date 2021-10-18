import { expect } from 'chai'
import { isEqual } from 'lodash'

import { missionExists, sortMissionsByKey } from './apiHelpers'
import { missions } from '../components/MissionCards/missions.json'

describe('API Helpers', () => {
  describe('missionExists', () => {
    it('should return true is a mission exists', () => {
      missions.forEach(element => {
        expect(missionExists(missions, element.id)).to.equal(true)
      });
    });
    it('should return false if a mission does not exist', () => {
      expect(missionExists(missions, "random-string")).to.equal(false)
      expect(missionExists(missions, 123)).to.equal(false)
      expect(missionExists(missions, true)).to.equal(false)
    })
  })

  describe('sortMissionByKey', () => {
    const testArray = [{"num": 1}, {"num": -1},{"num": 11},{"num": -11},{"num": 21},{"num": 13},{"num": 0},{"num": 12323},{"num": 7},{"num": 3}]
    
    const sortedArray = [{"num": -11}, {"num": -1},{"num": 0}, {"num": 1},{"num": 3}, {"num": 7}, {"num": 11}, {"num": 13},{"num": 21},{"num": 12323}]
    
    
    it('should sort object in a list by the given key', () => {
      const testArraySorted = sortMissionsByKey(testArray, "num")
      expect(expect(isEqual(testArraySorted, sortedArray)).to.equal(true))
    })
    it('should not change the order of already sorted list', () => {
      const twiceSortedArray = sortMissionsByKey(sortedArray, "num")
      expect(isEqual(twiceSortedArray, sortedArray)).to.equal(true)
    })
  })
})