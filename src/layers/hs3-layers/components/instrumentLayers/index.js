import { flighttrack, cpl, hiwrap } from "./helpers";

class LayerGenerator {
    constructor() {
        this.instruments = ["trackGlobalHawk", "cpl", "hiwrap", ] // add new instrument name here
        this.globalHawk_dates = ["2012-11-06"];
        this.cpl_dates = [];
        this.hiwrap_dates = [];
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
            case "trackGlobalHawk":
                if (!this.globalHawk_dates.includes(date)) return null;
                return flighttrack(date, index);
            case "cpl":
                if(!this.cpl_dates.includes(date)) return null;
                return cpl(date, index);
            case "hiwrap":
                if(!this.hiwrap_dates.includes(date)) return null;
                return hiwrap(date, index);
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
        return this.sortedUniqueDates([...this.globalHawk_dates]).map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
    }
}

let layersGen = new LayerGenerator();
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
