import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function npol (date, index) {
    /** 
    * returns structured npol meta item.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when the flight took off that collected npol data.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured npol meta item.
    */

    return {
        layerId: `${date}-${index}-npol`,
        fieldCampaignName: "Olympex",
        shortName: "olympexnpol",
        addOnTickEventListener: true, // helps to update viz on temporal change.
        displayName: "NASA S-Band Dual Polarimetric Doppler Radar (NPOL)",
        variableName: "ZZ Radar Reflectivity in RHI-A mode",
        unit: "dBZ",
        // for each data available accross each date, create a list of tile locations. 
        // tileLocation: [`${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/npol/${date.replace(/-/g,'')}/tileset.json`],
        tileLocation: [ `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/npol/20151203b/tileset.json`,
                        `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/npol/20151203/tileset.json` ],
        date,
        type: "instrument",
        platform: "ground",
        displayMechanism: "3dtile"
      };
}