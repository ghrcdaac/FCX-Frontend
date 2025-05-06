import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function lip (date, index) {
    /** 
    * returns structured flight meta item.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when the flight took off.
    * @param {aircraft} string - Type of aircraft used in the field campaign.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured flight meta item.
    */
    return {
        layerId: `${date}-${index}-lip`,
        shortName: "tcsplip",
        displayName: "Lightning Instrument Package",
        czmlLocation: `${newFieldCampaignsBaseUrl}/tcsp/instrument-processed-data/LIP/TCSP_LIP_${date.replace(/-/g,'')}.czml`,
        date,
        type: "instrument",
        platform: "air",
        displayMechanism: "czml",
    }
}