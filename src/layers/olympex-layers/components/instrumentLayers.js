import { flightTrackBaseUrl } from "../../../config";

function getInstrumentsItem(date, instrumentType) {
/** 
* forms a instrument meta for requested instruments in a particular date, i.e. collect the meta of data for various instruments.
* @param {string} date - YYYY-MM-DD format. Date of the campaign.
* @param {string} instrumentType - the name of the instrument, whose meta is needed for a particular date.
* @return {object} A structured instrument meta item.
*/
    switch(instrumentType) {
        case "trackEr2":
            return flighttrack(date, "er2");
        case "trackDc8":
            return flighttrack(date, "dc8");
        default:
            return {}
    }
}

const flighttrack = (date, aircraft, index) => {
    // TODO: how to get start and end time of the campaign for a particular date.????
    if (aircraft == "er2") {
        return {
            layerId: `${date}-track${index}-er2`,
            shortName: "flight14",
            displayName: "Flight Track",
            czmlLocation: `${flightTrackBaseUrl}/flight_track/goesrplt_naver2_IWG1_20170514-1922`,
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
            czmlLocation: `${flightTrackBaseUrl}/flight_track/goesrplt_naver2_IWG1_20170514-1922`,
            start: "2017-05-14T10:04:54Z",
            end: "2017-05-14T19:22:07Z",
            date: "2017-05-14",
            type: "track",
            platform: "air",
            displayMechanism: "czml",
        }
    }
}

const dates = ["2017-05-14"];
const instruments = ["trackEr2", "trackDc8"]

const instrumentLayers = dates.map(date => ({
        date: date,
        items: instruments.map((instrum, index) => getInstrumentsItem(date, instrum, index))
    }));

export default instrumentLayers;