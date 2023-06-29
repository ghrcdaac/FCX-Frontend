import { flighttrack } from "./helpers";

class LayerGenerator {
    constructor() {
        this.instruments = ["trackDc8"] // add new instrument name here
        this.dc8_dates = ["2021-08-17", "2021-08-20", "2021-08-21", "2021-08-24", "2021-08-26", "2021-08-28", "2021-09-01", "2021-09-04"];
        // add dates when data for new instrument are available
    }

    sortedUniqueDates(date) {
        /**
        * @param {array} dates array of dates.
        */
        const unique = [...date].filter((value, index, array) => array.indexOf(value) === index);
        return unique.sort();
    }

    getInstrumentsItem(date, instrumentType, index) {
        /**
        * forms a instrument meta for requested instruments in a particular date, i.e. collect the meta of data for various instruments.
        * @param {string} date - YYYY-MM-DD format. Date of the campaign.
        * @param {string} instrumentType - the name of the instrument, whose meta is needed for a particular date.
        * @param {index} number (Optional) - Index of the instrument in the list of instruments that are visualization wanted
        * @return {object} A structured instrument meta item.
        */
        switch (instrumentType) {
            case "trackDc8":
                if (!this.dc8_dates.includes(date)) return null;
                return flighttrack(date, "dc8", index);
            default:
                return null
            // add case for new instrument here
        }
    }

    generateLayer() {
        /**
        * @return {object} A structured instruments layer.
        */
        // add new instrument dates here, to only get layers for the unique dates.
        return this.sortedUniqueDates([...this.dc8_dates]).map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
    }
}

let layersGen = new LayerGenerator();
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
