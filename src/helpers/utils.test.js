import { expect } from "chai"
import { isEqual } from 'lodash'

import { getLayer } from "./utils"
import { getCampaignInfo } from '../layers/layers'

describe('utils', () => {
  describe('getLayer', () => {
    const dataBaseUrl = process.env.bamboo_DATA_BASE_URL || "https://ghrc-fcx-viz-output.s3-us-west-2.amazonaws.com"
    const testLayer1 = {
      layerId: "2017-04-11-crs",
      fieldCampaignName: "GOES-R PLT",
      shortName: "goesrpltcrs",
      addOnTickEventListener: true,
      displayName: "Cloud Radar System",
      tileLocation: `${dataBaseUrl}/fieldcampaign/goesrplt/2017-04-11/crs/tileset.json`,
      date: "2017-04-11",
      start: "2017-04-11T16:29:39Z",
      end: "2017-04-11T20:11:50Z",
      type: "instrument",
      platform: "air",
      displayMechanism: "3dtile",
    }
    const testLayer2 = {
      layerId: "2017-04-18-glp",
      fieldCampaignName: "GOES-R PLT",
      shortName: "glm",
      addOnTickEventListener: true,
      displayName: "GLM Points",
      variableName: "Lightning Events",
      unit: "dBZ",
      tileLocation: `${dataBaseUrl}/fieldcampaign/goesrplt/2017-04-18/glm_points/GLMpoints.json`,
      date: "2017-04-18",
      start: "2017-04-18T00:00:00Z",
      end: "2017-04-18T23:59:59Z",
      type: "instrument",
      platform: "satellite",
      dispType: 'Intensity',
      displayMechanism: "points",
    }
    const campaign = getCampaignInfo('goes-r-plt')
    it('should return a campaign layer given a layerId', () => {
      const outputLayer1 = getLayer(testLayer1.layerId, campaign)
      const outputLayer2 = getLayer(testLayer2.layerId, campaign)
      expect(isEqual(testLayer1, outputLayer1)).to.equal(true)
      expect(isEqual(testLayer2, outputLayer2)).to.equal(true)
    })
  })
})