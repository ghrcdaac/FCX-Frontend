import { dataBaseUrl } from "../../config"
import { getLayerDate, compareDate, getDateString } from "./layerDates"

class LayerGenerator{

  constructor(fieldCampaignName){
    this.fieldCampaignName = fieldCampaignName
    this.dates = {}
    this.layerMetaData = {}
  }

  getFlightTrack = ({ date, url, flight }) => {
    const fileName = flight.toLowerCase() === 'er2' ?
        `FCX_${this.fieldCampaignName}_MetNav_ER2_${getDateString(date)}_R0.czml` :
        `${this.fieldCampaignName}_MetNav_P3B_${getDateString(date)}_R0`

    return {
      displayName: `Flight Track ${flight}`,
      type: "track",
      displayMechanism: "czml",
      czmlLocation: url ? url : `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/${flight.toLowerCase()}/${fileName}`,
    }
  }

  getHIWRAP = ({ date, HiWRAPVar }) => {
    return {
      displayName: `High Altitude Imaging Wind and Rain Airborne Profiler ${HiWRAPVar}`,
      variableName: "Radar Reflectivity",
      unit: "dBZ",
      type: "instrument",
      displayMechanism: "3dtile",
      tileLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/hiwrap/${HiWRAPVar}_dBZe/tileset.json`,
    }
  }
  
  getCRS = ({ date }) => {
    return {
      displayName: "Cloud Radar System",
      variableName: "Radar Reflectivity",
      unit: "dBZ",
      type: "instrument",
      displayMechanism: "3dtile",
      tileLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/crs/tileset.json`,
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
      tileLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/cpl/cpl_atb/tileset.json`,
    }
  }
  
  getLIP = ({ date }) => {
    return {
      displayName: "Lightning Instrument Package",
      variableName: "Electric Field",
      unit: "kV/m",
      type: "instrument",
      displayMechanism: "czml",
      czmlLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/lip/FCX_${this.fieldCampaignName}_LIP_ER2_${getLayerDate(date)}.czml`,
    }
  }

  mapInstrumentToGenerator = (instrument) => {
    const mapping = {
      'crs': this.getCRS,
      'cpl': this.getCPL,
      'lip': this.getLIP,
      'hiwrap-Ka': this.getHIWRAP,
      'hiwrap-Ku': this.getHIWRAP,
      'hiwrap': this.getHIWRAP,
      'flightTrack-er2': this.getFlightTrack, 
      'flightTrack-p3': this.getFlightTrack, 
    }
    
    return mapping[instrument]
  }

  getLayer = (
    {instrument, platform, ...rest},
    date, start, endDate, end, url
  ) => {
    const generator = this.mapInstrumentToGenerator(instrument)

    return {
      date,
      shortName: instrument,
      layerId: `${date}-${instrument}`,
      fieldCampaignName: this.fieldCampaignName,
      start: `${date}T${start}Z`,
      end: `${endDate ? endDate : date}T${end}Z`,
      platform,
      ...generator({ date, url, ...rest }),
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
    
    const generatedLayer = Object.keys(layers).map((date) => {
      return {
        date,
        items: layers[date]
      }
    }).sort((b, a) => {
      return compareDate(a.date, b.date)
    })

    console.log(generatedLayer)

    return generatedLayer
  }
}

export default LayerGenerator
