import { flighttrack } from "./helpers";

const instruments = ["trackEr2", "trackDc8"]
// const instruments = ["trackDc8"]

function getInstrumentsItem(date, instrumentType, index) {
    /** 
    * forms a instrument meta for requested instruments in a particular date, i.e. collect the meta of data for various instruments.
    * @param {string} date - YYYY-MM-DD format. Date of the campaign.
    * @param {string} instrumentType - the name of the instrument, whose meta is needed for a particular date.
    * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
    * @return {object} A structured instrument meta item.
    */
    switch(instrumentType) {
        case "trackEr2":
            if (!er2_dates.includes(date)) return null;
            return flighttrack(date, "er2", index);
        case "trackDc8":
            if (!dc8_dates.includes(date)) return null;
            return flighttrack(date, "dc8", index);
        default:
            return null
    }
}

/**
 * For the list of date when the campaign took place,
 * And the list of instruments data (that are both available and visualize needed)
 * Returns the object with date and list of items (instrument items data for visualization)
*/

let dc8_dates = ["2015-11-05", "2015-11-10", "2015-11-12", "2015-11-13", "2015-11-14", "2015-11-19", "2015-11-23", "2015-11-24", "2015-11-25", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-18", "2015-12-19"]
let er2_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-19", "2015-11-23", "2015-11-24", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-09", "2015-12-10", "2015-12-12", "2015-12-14", "2015-12-15"]

var unique_dates = [...dc8_dates, ...er2_dates].filter((value, index, array) => array.indexOf(value) === index);

const instrumentLayers = unique_dates.map(date => ({
        date,
        items: instruments.map((instrum, index) => getInstrumentsItem(date, instrum, index)).filter(n => n)
    }));

export default instrumentLayers;