import { flighttrack } from "./helpers";

class LayerGenerator {
    constructor(instruments) {
        this.uniqueDates = []
        this.instruments = instruments;
    }

    addDates(dates) {
        /**
        * @param {array} dates array of dates.
        */
        this.uniqueDates = [...this.uniqueDates, ...dates].filter((value, index, array) => array.indexOf(value) === index);
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
                if (!er2_dates.includes(date)) return null; //TODO: later take er2_dates when loaded through addDates.
                return flighttrack(date, "er2", index);
            case "trackDc8":
                if (!dc8_dates.includes(date)) return null;
                return flighttrack(date, "dc8", index);
            default:
                return null
        }
    }

    generateLayer() {
        /**
        * @return {object} A structured instruments layer.
        */
        return this.uniqueDates.map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
    }
}


let instruments = ["trackEr2", "trackDc8"]
let dc8_dates = ["2015-11-05", "2015-11-10", "2015-11-12", "2015-11-13", "2015-11-14", "2015-11-19", "2015-11-23", "2015-11-24", "2015-11-25", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-18", "2015-12-19"];
let er2_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-19", "2015-11-23", "2015-11-24", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-09", "2015-12-10", "2015-12-12", "2015-12-14", "2015-12-15"];

let layersGen = new LayerGenerator(instruments);
layersGen.addDates(dc8_dates);
layersGen.addDates(er2_dates);
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
