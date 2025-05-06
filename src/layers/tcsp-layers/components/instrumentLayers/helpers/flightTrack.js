import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function flighttrack (date, index) {
    /** 
    * returns structured flight meta item.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when the flight took off.
    * @param {aircraft} string - Type of aircraft used in the field campaign.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured flight meta item.
    */
    return {
        layerId: `${date}-track${index}-er2`,
        shortName: "track",
        displayName: "Flight Track",
        czmlLocation: `${newFieldCampaignsBaseUrl}/tcsp/instrument-processed-data/ER2_Flight_Nav/tcsp_naver2_${date.replace(/-/g,'')}.czml`,
        date,
        type: "track",
        platform: "air",
        displayMechanism: "czml",
    }
}