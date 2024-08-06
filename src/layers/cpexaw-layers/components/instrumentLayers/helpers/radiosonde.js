import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function radiosonde (date, index) {
    /** 
    * returns structured Radiosonde meta item.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when the flight took off that collected Radiosonde data.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured Radiosonde meta item.
    */
   
    return {
      layerId: `${date}-${index}-radiosonde`,
      fieldCampaignName: "CPEX-AW",
      shortName: "cpexawradiosonde",
      addOnTickEventListener: true, // helps to update viz on temporal change.
      displayName: "RADIOSONDE",
      variableName: "skewT graph",
      unit: "temperature (degree celsius) vs pressure (mb)",
    //   tileLocation: `${newFieldCampaignsBaseUrl}/CPEX-AW/instrument-processed-data/radiosonde/3dTiles/${date.replace(/-/g,'')}/tileset.json`,
      czmlLocation: `${newFieldCampaignsBaseUrl}/CPEX-AW/instrument-processed-data/radiosonde/czml/rs_with_pin_latest.czml`,
      date,
      type: "instrument-sonde",
      platform: "air",
      displayMechanism: "czml"
    };
}