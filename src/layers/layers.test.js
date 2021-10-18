import { expect } from "chai";
import { isEqual } from 'lodash'

import { getCampaignInfo } from "./layers";
import goes_r_plt_campaign from './goes-r-plt-layers'

describe('layers', () => {
  describe('getCampaignInfo', () => {
    it('should return campaign info of the given campaign', () => {
      const mission = 'goes-r-plt'
      const campaign = getCampaignInfo(mission)
      expect(isEqual(campaign, goes_r_plt_campaign)).to.equal(true)
    })
  })
})