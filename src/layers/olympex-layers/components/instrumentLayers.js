import { flightTrackBaseUrl } from "../../../config";

// Layers of instruments that can be visualized
const layers_2017_05_14 = [
    {
        layerId: "2017-05-14-track14",
        shortName: "flight14",
        displayName: "Flight Track",
        czmlLocation: `${flightTrackBaseUrl}/flight_track/goesrplt_naver2_IWG1_20170514-1922`,
        start: "2017-05-14T10:04:54Z",
        end: "2017-05-14T19:22:07Z",
        date: "2017-05-14",
        type: "track",
        platform: "air",
        displayMechanism: "czml",
    },
    // {
    //     layerId: "2017-05-14-crs",
    //     fieldCampaignName: "GOES-R PLT",
    //     shortName: "goesrpltcrs",
    //     addOnTickEventListener: true,
    //     displayName: "Cloud Radar System",
    //     tileLocation: `${dataBaseUrl}/fieldcampaign/goesrplt/2017-05-14/crs/tileset.json`,
    //     date: "2017-05-14",
    //     start: "2017-05-14T12:55:46Z",
    //     end: "2017-05-14T18:31:29Z",
    //     type: "instrument",
    //     platform: "air",
    //     displayMechanism: "3dtile",
    // },
    ]

const instrumentLayers = [
{ date: "2017-05-14", items: [...layers_2017_05_14] }
]

export default instrumentLayers;