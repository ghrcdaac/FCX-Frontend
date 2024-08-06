import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function mrr (date, index) {
    return {
        layerId: `${date}-${index}-mrr`,
        fieldCampaignName: "Olympex",
        shortName: "olympexmrr",
        addOnTickEventListener: true, // helps to update viz on temporal change.
        displayName: "Micro Rain Radar",
        variableName: "Precipitation events",
        unit: "mm/hr(Rain rate)",
        tileLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/mrr/reflectivity_data_full1.json`,
        date: "2016-01-15", //TODO: add date and time in olympex-instruments.json
        start: "2016-01-15T00:00:01Z",
        end: "2016-01-15T23:59:59Z",
        type: "instrument",
        platform: "ground",
        dispType: 'MRRIntensity',
        displayMechanism: "points"
    };
}