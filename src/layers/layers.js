import goes_r_plt_campaign from './goes-r-plt-layers'
import impacts_campaign from './impacts-layers'
import olympex_layers from './olympex-layers'
import cpexaw_layers from './cpexaw-layers'
import hs3_layers from './hs3-layers'
import lee_campaign from './lee-layers'

const campaigns = {
  "goes-r-plt": goes_r_plt_campaign,
  "impacts": impacts_campaign,
  "olympex": olympex_layers,
  "cpexaw": cpexaw_layers,
  "hs3": hs3_layers,
  "lee": lee_campaign
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

const getDefaultLayers = (campaign) => {
  const layers = campaigns[campaign].layers
  const firstWithItems = layers.find((layer) => layer.items && layer.items.length > 0) || layers[0]
  return (firstWithItems?.items || [])
    .filter((item) => item.defaultSelected !== false)
    .map((item) => item.layerId)
}

export default campaigns
export {
  getCampaignInfo,
  getDefaultLayers,
  getDatesMap,
}