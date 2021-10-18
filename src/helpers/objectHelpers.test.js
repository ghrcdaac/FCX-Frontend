import { expect } from "chai"

import { deepFreeze } from "./objectHelpers"

describe('Object Helpers',() => {
  describe('deepFreeze', () => {
    const obj = { a: { b: [{c: 23}]}}
    it('should deep freeze the given object', () => {
      deepFreeze(obj)
      expect(Object.isFrozen(obj.a)).to.equal(true)
      expect(Object.isFrozen(obj.a.b)).to.equal(true)
      expect(Object.isFrozen(obj.a.b[0])).to.equal(true)
    })
    it('should not alter behivour of frozen object', () => {
      deepFreeze(obj)
      deepFreeze(obj)
      expect(Object.isFrozen(obj.a)).to.equal(true)
      expect(Object.isFrozen(obj.a.b)).to.equal(true)
      expect(Object.isFrozen(obj.a.b[0])).to.equal(true)
    })
  })
})