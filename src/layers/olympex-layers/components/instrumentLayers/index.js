import { flighttrack, crs, cpl, hiwrap } from "./helpers";

class LayerGenerator {
    constructor() {
        this.instruments = ["trackEr2", "trackDc8", "crs", "cpl", "hiwrap"] // add new instrument name here
        this.dc8_dates = ["2015-11-05", "2015-11-10", "2015-11-12", "2015-11-13", "2015-11-14", "2015-11-19", "2015-11-23", "2015-11-24", "2015-11-25", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-18", "2015-12-19"];
        this.er2_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-19", "2015-11-23", "2015-11-24", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-09", "2015-12-10", "2015-12-12", "2015-12-14", "2015-12-15"];
        this.crs_dates = ["2015-11-10", "2015-11-18", "2015-11-23", "2015-11-24", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10"]
        this.cpl_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-18", "2015-11-23", "2015-11-24", "2015-12-01", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-13", "2015-12-15"]
        this.hiwrap_dates = ["2015-11-18", "2015-11-23", "2015-11-24", "2015-12-01", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12"];
        // add dates when data for new instrument are available
    }

    uniqueDates(date) {
        /**
        * @param {array} dates array of dates.
        */
        return [...date].filter((value, index, array) => array.indexOf(value) === index);
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
            case "trackEr2":
                if (!this.er2_dates.includes(date)) return null;
                return flighttrack(date, "er2", index);
            case "trackDc8":
                if (!this.dc8_dates.includes(date)) return null;
                return flighttrack(date, "dc8", index);
            case "crs":
                if(!this.crs_dates.includes(date)) return null;
                return crs(date, index);
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
        return this.uniqueDates([...this.dc8_dates, ...this.er2_dates, ...this.crs_dates, ...this.cpl_dates, ...this.hiwrap_dates]).map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
    }
}

let layersGen = new LayerGenerator();
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
