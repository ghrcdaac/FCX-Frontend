import { shallow } from "enzyme";
import toJSON from "enzyme-to-json"
import React from "react";

import '../customized-components/react-timeline-9000/src/setupTests'

import Card from '../components/MissionCards/Card'
import MissionsCards from '../components/MissionCards/MissionsCards'

describe("Cards Components", () => {
  describe("Card", () => {
    it("Should Match Card Snapshot", () => {
      const wrapper = shallow(<Card />)
      expect(toJSON(wrapper)).toMatchSnapshot()
    })
  })
  describe("Mission Cards", () => {
    it("Should Match Mission Card Snapshot", () => {
      const wrapper = shallow(<MissionsCards />)
      expect(toJSON(wrapper)).toMatchSnapshot()
    })
  })
})