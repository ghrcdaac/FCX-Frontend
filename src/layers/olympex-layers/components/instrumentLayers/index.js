import { flighttrack } from "./helpers";

const dates = ["2015-11-05"];
// const instruments = ["trackEr2", "trackDc8"]
const instruments = ["trackDc8"]

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
            return flighttrack(date, "er2", index);
        case "trackDc8":
            return flighttrack(date, "dc8", index);
        default:
            return {}
    }
}

/**
 * For the list of date when the campaign took place,
 * And the list of instruments data (that are both available and visualize needed)
 * Returns the object with date and list of items (instrument items data for visualization)
*/

const instrumentLayers = dates.map(date => ({
        date: date,
        items: instruments.map((instrum, index) => getInstrumentsItem(date, instrum, index))
    }));

export default instrumentLayers;