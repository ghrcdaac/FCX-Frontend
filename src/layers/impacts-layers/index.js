import { dataBaseUrl } from "../../config"
import {
  cpl_er2,
  crs_er2,
  lip_er2,
  hiwrap_er2,
  defaultCamera,
  legends,
  links,
  dois,
  campaign,
  description
} from "./data"
import LayerGenerator from '../utils/LayerGenerator'

const generator = new LayerGenerator(campaign)

generator.addLayer({
  instrument: 'crs',
  platform: 'air-er2'
}, crs_er2)

generator.addLayer({
  instrument: 'lip',
  platform: 'air-er2'
}, lip_er2)

generator.addLayer({
  instrument: 'cpl',
  platform: 'air-er2'
}, cpl_er2)

generator.addLayer({
  instrument: 'hiwrap',
  platform: 'air-er2'
}, hiwrap_er2)

const layers = generator.generateLayers()

const impacts_campaign = {
  title: `${campaign} Field Campaign`,
  logo: `${dataBaseUrl}/fieldcampaign/${campaign.toLowerCase()}/logo/${campaign.toLowerCase()}_logo_small.png`,
  description,
  links,
  dois,
  layers,
  legends,
  defaultCamera,
}

export default impacts_campaign