import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function flighttrack (date, aircraft, index) {
    /** 
    * returns structured flight meta item.
    * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when the flight took off.
    * @param {aircraft} string - Type of aircraft used in the field campaign.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured flight meta item.
    */
    
    // TODO: how to get start and end time of the campaign for a particular date.????
    if (aircraft == "er2") {
        return {
            layerId: `${date}-track${index}-er2`,
            shortName: "flight14",
            displayName: "Flight Track",
            czmlLocation: `${newFieldCampaignsBaseUrl}Olympex/instrument-processed-data/nav_dc8/olympex_navdc8_IWG1_${date.replace(/-/g,'')}-2308.czml`,
            start: "2017-05-14T10:04:54Z",
            end: "2017-05-14T19:22:07Z",
            date: "2017-05-14",
            type: "track",
            platform: "air",
            displayMechanism: "czml",
        }
    } else if (aircraft == "dc8") {
        return {
            layerId: `${date}-track${index}-dc8`,
            shortName: "flight14",
            displayName: "Flight Track",
            czmlLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/nav_dc8/olympex_navdc8_IWG1_${date.replace(/-/g,'')}-2308.czml`,
            start: "2015-11-05T10:04:54Z",
            end: "2015-11-06T19:22:07Z",
            date: "2015-11-05",
            type: "track",
            platform: "air",
            displayMechanism: "czml",
        }
    }
}