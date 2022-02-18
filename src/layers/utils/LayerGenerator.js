import { dataBaseUrl } from "../../config"

class LayerGenerator{

  constructor(fieldCampaignName){
    this.fieldCampaignName = fieldCampaignName
    this.dates = {}
    this.layerMetaData = {}
  }
  
  getCRS = ({ date }) => {
    return {
      displayName: "Cloud Radar System",
      variableName: "Radar Reflectivity",
      unit: "dBZ",
      type: "instrument",
      displayMechanism: "3dtile",
      titleLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/crs/tilest.json`,
    }
  }
  
  getCPL = ({ date }) => {
    return {
      addOnTickEventListener: true,
      displayName: "Cloud Physics LiDAR",
      variableName: "Radar Reflectivity",
      unit: "dBZ",
      type: "instrument",
      displayMechanism: "3dtile",
      titleLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/cpl/cpl_atb/tileset.json`,
    }
  }
  
  getLIP = ({ date }) => {
    return {
      displayName: "Lightning Instrument Package",
      variableName: "Electric Field",
      unit: "kV/m",
      type: "instrument",
      displayMechanism: "czml",
      titleLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/LIP/LIP.czml`,
    }
  }

  mapInstrumentToGenerator = (instrument) => {
    const mapping = {
      'crs': this.getCRS,
      'cpl': this.getCPL,
      'lip': this.getLIP
    }

    return mapping[instrument]
  }

  getLayer = (
    {instrument, platform, ...rest},
    date, start, endDate, end
  ) => {
    const generator = this.mapInstrumentToGenerator(instrument)

    return {
      ...generator({ date, platform }),
      date,
      shortName: instrument,
      layerId: `${date}-${instrument}`,
      fieldCampaignName: this.fieldCampaignName,
      start: `${date}T${start}Z`,
      end: `${endDate ? endDate : date}T${end}Z`,
      platform,
    }
  }

  addLayer = (
    {instrument, platform, ...rest},
    dates
  ) => {
    dates.forEach(dateString => {
      const date = dateString.split(/\s/g)
      const startDate = date[0]
      const key = `${instrument}-${platform}`
      const params = {
        instrument,
        platform,
        ...rest
      }
      
      this.layerMetaData[key] =
        this.layerMetaData[key] ?
        this.layerMetaData[key] :
        {}

      this.layerMetaData[key].params =
        this.layerMetaData[key].params ?
        this.layerMetaData[key].params :
        params
      
      this.layerMetaData[key].dates =
        this.layerMetaData[key].dates ?
        this.layerMetaData[key].dates :
        {}
      this.layerMetaData[key].dates[startDate] = date

      this.dates[startDate] =
        this.dates[startDate] ?
        this.dates[startDate] :
        {}
      
      this.dates[startDate][key] = true
    })
  }

  generateLayers = () => {
    const layers = {}    
    Object.keys(this.dates).forEach((date) => {
      Object.keys(this.dates[date]).forEach(entry => {

        const metaData = this.layerMetaData[entry]
        const dates = metaData.dates[date]
        const params = metaData.params
        
        const layer = this.getLayer(params, ...dates)
        layers[date] = layers[date] ? [...layers[date], layer]: [layer]
      })
    })
    return Object.keys(layers).map((date) => {
      return {
        date,
        items: layers[date]
      }
    })
  }
}

export default LayerGenerator
