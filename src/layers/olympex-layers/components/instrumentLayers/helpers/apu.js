import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function apu (date, index) {
    /** 
    * returns structured apu meta item.
    * @param {date} string - YYYY-MM-DD format. Date of the campaign when during instrument
    * @param {index} number - Index of the instrument in the list of instruments that are visualization wanted
    * @return {Object} structured apu meta item.
    */

    return {
        layerId: `${date}-${index}-apu`,
        fieldCampaignName: "Olympex",
        shortName: "olympexapu",
        addOnTickEventListener: true, // helps to update viz on temporal change.
        displayName: "Autonomous Parsivel Unit",
        variableName: "Precipitation events",
        unit: "mm/hr(Rain rate)",
        tileLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/apu/apu08/olympex_apu08_20151203_rainparameter_min.json`,
        date: "2015-12-03",
        start: "2015-12-03T00:00:01Z",
        end: "2015-12-03T23:59:59Z",
        type: "instrument",
        platform: "ground",
        dispType: 'RainIntensity',
        displayMechanism: "points"
    };
}


