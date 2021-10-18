import { shallow } from "enzyme";
import toJSON from "enzyme-to-json"
import React from "react";
import { getCampaignInfo } from '../layers/layers'

import '../customized-components/react-timeline-9000/src/setupTests'
import CampaignInfoLinks from "../components/campaignInfo";

describe("CampaignInfo Component", () => {
  it("Should Match CampaignInfo Snapshot", () => {
    const wrapper = shallow(
      <CampaignInfoLinks
        campaign={getCampaignInfo('goes-r-plt')}
      />
    )
    expect(toJSON(wrapper)).toMatchSnapshot()
  })
})