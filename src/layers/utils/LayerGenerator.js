import { dataBaseUrl } from "../../config"
import { getLayerDate, compareDate, getDateString } from "./layerDates"

class LayerGenerator{

  constructor(fieldCampaignName){
    this.fieldCampaignName = fieldCampaignName
    this.dates = {}
    this.layerMetaData = {}
  }

  getEXRAD = ({date}) => {
    return {
      addOnTickEventListener: true,
      displayName: "ER-2 X-Band Doppler Radar",
      variableName: "Wind",
      unit: "dBZ",
      type: "instrument",
      displayMechanism: "3dtile",
      tileLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/exrad/X_dBZe/tileset.json`,
    }
  }

  getModelCorrectionOffsets(flight, date) {
    /**
     * This function takes in flight model type (P3 | ER2 used in layer implementation) and returns correction offsets for the model.
     * You can change the correction offset for entire flight type (dont use switch)
     * Even change the correction offset for specific date of a flight type (use switch statement)
     */
    // default correction offsets is zero
    let modelCorrectionOffsets = {
      heading: 0,
      pitch: 0,
      roll: 0
    };
    if (flight === "ER2") {
      // default -90 degree correction heading offset for er-2 model in flight track model of all impact layers.
      modelCorrectionOffsets = { ...modelCorrectionOffsets, heading: -90 }
      // control for specific model of specific date
      switch (date) {
        case "2020-02-07":
          modelCorrectionOffsets = { ...modelCorrectionOffsets, heading: 0 }; // no correction needed
          break;
        case "2020-02-01":
          modelCorrectionOffsets = { ...modelCorrectionOffsets, heading: 0 }; // no correction needed
          break;
        case "2020-01-18":
          modelCorrectionOffsets = { ...modelCorrectionOffsets, heading: 0 }; // no correction needed
          break;
        default:
          break;
      }
      return modelCorrectionOffsets;
    } else if (flight === "P3") {
      // default -90 degree correction heading offset for P3 model in flight track model of all impact layers.
      modelCorrectionOffsets = { ...modelCorrectionOffsets, heading: -90 }
      // control for specific model of specific date
      switch (date) {
        default:
          break;
      }
      return modelCorrectionOffsets;
    } else {
      return modelCorrectionOffsets;
    }
  }

  getFlightTrack = ({ date, url, flight }) => {
    let fileName = flight.toLowerCase() === 'er2' ? `${this.fieldCampaignName}_MetNav_${flight.toUpperCase()}_${getDateString(date)}_R0` : `${this.fieldCampaignName}_MetNav_P3B_${getDateString(date)}_R0`;
    const modelCorrectionOffsets = this.getModelCorrectionOffsets(flight, date);

    return {
      displayName: `Flight Track ${flight}`,
      type: "track",
      displayMechanism: "czml",
      czmlLocation: url ? url : `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/${flight.toLowerCase()}/${fileName}`,
      modelCorrectionOffsets
    }
  }

  getHIWRAP = ({ date, HiWRAPVar }) => {
    return {
      addOnTickEventListener: true,
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
      addOnTickEventListener: true,
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
      addOnTickEventListener: true,
      displayName: "Lightning Instrument Package",
      variableName: "Electric Field",
      unit: "kV/m",
      type: "instrument",
      platform: "air",
      displayMechanism: "czml",
      czmlLocation: `${dataBaseUrl}/fieldcampaign/${this.fieldCampaignName.toLowerCase()}/${date}/lip/FCX_${this.fieldCampaignName}_LIP_ER2_${getLayerDate(date)}.czml`,
    }
  }

  mapInstrumentToGenerator = (instrument) => {
    const mapping = {
      'crs': this.getCRS,
      'cpl': this.getCPL,
      'exrad': this.getEXRAD,
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

    return generatedLayer
  }
}

export default LayerGenerator
