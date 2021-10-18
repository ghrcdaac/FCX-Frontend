import { shallow } from "enzyme";
import toJSON from "enzyme-to-json"
import React from "react";
import { getCampaignInfo } from "../layers/layers";

import '../customized-components/react-timeline-9000/src/setupTests'
import { Dock } from "../components/dock";

describe("Dock Component", () => {
  it("Should Match Dock Snapshot", () => {
    const wrapper = shallow(
      <Dock 
        campaign={getCampaignInfo('goes-r-plt')}
        viewer={null}
      />)
    expect(toJSON(wrapper)).toMatchSnapshot()
  })
})