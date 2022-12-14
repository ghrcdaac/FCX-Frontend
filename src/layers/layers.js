import goes_r_plt_campaign from './goes-r-plt-layers'
import impacts_campaign from './impacts-layers'


const campaigns = {
  "goes-r-plt": goes_r_plt_campaign,
  "impacts": impacts_campaign,
}

const getCampaignInfo = (mission) => {
  return campaigns[mission]
}

const getMissionDates = (mission) => {
  return getCampaignInfo(mission).layers
          .map(layer => layer.date)
}

const getDatesMap = () => {
  const datesMap = {}
  Object.keys(campaigns)
    .forEach(mission => {
      datesMap[mission] = getMissionDates(mission)
    })

  return datesMap
}

const getDefaultLayers = (campaign) => campaigns[campaign].layers[0].items.map(item => {
  return item.layerId
})

export default campaigns
export {
  getCampaignInfo,
  getDefaultLayers,
  getDatesMap,
}