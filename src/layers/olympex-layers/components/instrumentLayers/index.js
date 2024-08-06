import { flighttrack, crs, cpl, hiwrap, nexradKATX, nexradKRTX, nexradKLGX, npol, apu, d3rKu, d3rKa, mrr } from "./helpers";
import timeData from "../../../../data/olympex-instruments.json"

/* TODO: To fix timeline issue in Olympex, added start and end times for instruments of 2015-11-10.
Follow the example code changes of CRS for other instruments and dates.
*/
class LayerGenerator {
    constructor() {
        this.instruments = ["trackEr2", "trackDc8", "crs", "cpl", "hiwrap", "nexradKATX", "nexradKRTX", "nexradKLGX", "npol", "apu", "d3rKu", "d3rKa", "mrr"] // add new instrument name here
        this.dc8_dates = ["2015-11-05", "2015-11-10", "2015-11-12", "2015-11-13", "2015-11-14", "2015-11-19", "2015-11-23", "2015-11-24", "2015-11-25", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-18", "2015-12-19"];
        this.er2_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-19", "2015-11-23", "2015-11-24", "2015-12-02", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-09", "2015-12-10", "2015-12-12", "2015-12-14", "2015-12-15"];
        // this.crs_dates = ["2015-11-10", "2015-11-18", "2015-11-23", "2015-11-24", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10"]
        this.crs_dates = ["2015-11-10", "2015-11-18"];
        this.cpl_dates = ["2015-11-09", "2015-11-10", "2015-11-17", "2015-11-18", "2015-11-23", "2015-11-24", "2015-12-01", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12", "2015-12-13", "2015-12-15"]
        this.hiwrap_dates = ["2015-11-18", "2015-11-23", "2015-11-24", "2015-12-01", "2015-12-03", "2015-12-04", "2015-12-05", "2015-12-08", "2015-12-10", "2015-12-12"];
        this.nexradKATX_dates = ["2016-05-01", "2016-04-30", "2016-04-29", "2016-04-28", "2016-04-27", "2016-04-26", "2016-04-25", "2016-04-24", "2016-04-23", "2016-04-22", "2016-04-21", "2016-04-20", "2016-04-19", "2016-04-18", "2016-04-17", "2016-04-16", "2016-04-15", "2016-04-14", "2016-04-13", "2016-04-12", "2016-04-11", "2016-04-10", "2016-04-09", "2016-04-08", "2016-04-07", "2016-04-06", "2016-04-05", "2016-04-04", "2016-04-03", "2016-04-02", "2016-04-01", "2016-03-31", "2016-03-30", "2016-03-29", "2016-03-28", "2016-03-27", "2016-03-26", "2016-03-25", "2015-12-31", "2015-12-30", "2015-12-29", "2015-12-28", "2015-12-27", "2015-12-26", "2015-12-25", "2015-12-24", "2015-12-23", "2015-12-22", "2015-12-21", "2015-12-20", "2015-12-19", "2015-12-18", "2015-12-17", "2015-12-16", "2015-12-15", "2015-12-14", "2015-12-13", "2015-12-12", "2015-12-11", "2015-12-10", "2015-12-09", "2015-12-08", "2015-12-07", "2015-12-06", "2015-12-05", "2015-12-04", "2015-12-03", "2015-12-02", ]
        this.nexradKRTX_dates = ["2016-05-01", "2016-04-30", "2016-04-29", "2016-04-28", "2016-04-27", "2016-04-26", "2016-04-25", "2016-04-24", "2016-04-23", "2016-04-22", "2016-04-21", "2016-04-20", "2016-04-19", "2016-04-18", "2016-04-17", "2016-04-16", "2016-04-15", "2016-04-14", "2016-04-13", "2016-04-12", "2016-04-11", "2016-04-10", "2016-04-09", "2016-04-08", "2016-04-07", "2016-04-06", "2016-04-05", "2016-04-04", "2016-04-03", "2016-04-02", "2016-04-01", "2016-03-31", "2016-03-30", "2016-03-29", "2016-03-28", "2016-03-27", "2016-03-26", "2016-03-25", "2016-03-24", "2016-03-23", "2016-03-22", "2015-12-31", "2015-12-30", "2015-12-29", "2015-12-28", "2015-12-27", "2015-12-26", "2015-12-25", "2015-12-24", "2015-12-23", "2015-12-22", "2015-12-21", "2015-12-20", "2015-12-19", "2015-12-18", "2015-12-17", "2015-12-16", "2015-12-15", "2015-12-14", "2015-12-13", "2015-12-12", "2015-12-11", "2015-12-10", "2015-12-09", "2015-12-08", "2015-12-07", "2015-12-06", "2015-12-05", "2015-12-04", "2015-12-03", "2015-12-02", "2015-12-01", "2015-11-30", "2015-11-29", "2015-11-28", "2015-11-27", "2015-11-26", "2015-11-25", "2015-11-24"]
        this.nexradKLGX_dates = ["2016-05-01", "2016-04-30", "2016-04-29", "2016-04-28", "2016-04-27", "2016-04-26", "2016-04-25", "2016-04-24", "2016-04-23", "2016-04-22", "2016-04-21", "2016-04-20", "2016-04-19", "2016-04-18", "2016-04-17", "2016-04-16", "2016-04-15", "2016-04-14", "2016-04-13", "2016-04-12", "2016-04-11", "2016-04-10", "2016-04-09", "2016-04-08", "2016-04-07", "2016-04-06", "2016-04-05", "2016-04-04", "2016-04-03", "2016-04-02", "2016-04-01", "2016-03-31", "2015-12-31", "2015-12-30", "2015-12-29", "2015-12-28", "2015-12-27", "2015-12-26", "2015-12-25", "2015-12-24", "2015-12-23", "2015-12-22", "2015-12-21", "2015-12-20", "2015-12-19", "2015-12-18", "2015-12-17", "2015-12-16", "2015-12-15", "2015-12-14", "2015-12-13", "2015-12-12", "2015-12-11", "2015-12-10", "2015-12-09", "2015-12-08", "2015-12-07", "2015-12-06", "2015-12-05", "2015-12-04", "2015-12-03", "2015-12-02", "2015-12-01", "2015-11-30"]
        this.npol_dates = ["2015-11-12", "2015-11-13", "2015-11-14", "2015-11-15", "2015-11-16", "2015-11-17", "2015-11-18", "2015-12-01", "2015-12-02", "2015-12-05", "2015-12-06", "2015-12-07", "2015-12-08", "2015-12-09", "2015-12-10", "2015-12-11", "2015-12-12", "2015-12-13", "2015-12-17", "2015-12-18", "2015-12-19", "2016-01-04", "2016-01-05", "2016-01-06", "2016-01-08", "2016-01-11", "2016-01-12", "2016-01-13", "2016-01-14"]
        this.apu_dates = ["2015-12-03"];
        this.d3rKu_dates = ["2016-01-15"];
        this.d3rKa_dates = ["2016-01-15"];
        this.mrr_dates = ["2016-01-15"];
        // add dates when data for new instrument are available
    }

    getDateTimes(instrument, date) {
        const times = timeData[instrument][date];
        if (times) {
          return { startTime: times[0], endTime: times[1] };
        }
        return null;
    };

    displayData(instrumentName, date) {
        if (timeData[instrumentName] && timeData[instrumentName][date]) {
            if (timeData[instrumentName][date].length == 0) {
                return [null, null];
            }
            return timeData[instrumentName][date];
        } else {
            return null;
        }
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
        let timeDate;
        switch (instrumentType) {
            case "trackEr2":
                if (!this.er2_dates.includes(date)) return null;
                // timeDate = this.displayData('trackEr2', date);
                // if (timeDate == null) return null;
                // if (!timeDate.startTime) return flighttrack(date, index, null, null);
                // return flighttrack(date, "er2", index, timeDate[0], timeDate[1]);
                return flighttrack(date, "er2", index);
            case "trackDc8":
                if (!this.dc8_dates.includes(date)) return null;
                // timeDate = this.displayData('trackDc8', date);
                // if (timeDate == null) return null;
                // if (!timeDate.startTime) return flighttrack(date, index, null, null);
                // return flighttrack(date, "dc8", index, timeDate[0], timeDate[1]);
                return flighttrack(date, "dc8", index);
            case "crs":
                timeDate = this.displayData('crs', date);
                if (timeDate == null) return null; //date for which crs data does not exist
                if (!timeDate.startTime) return crs(date, index, null, null);
                return crs(date, index, timeDate[0], timeDate[1]);
            case "cpl":
                if(!this.cpl_dates.includes(date)) return null;
                // timeDate = this.displayData('cpl', date);
                // if (timeDate == null) return null; 
                // if (!timeDate.startTime) return crs(date, index, null, null);
                // return cpl(date, index, timeDate[0], timeDate[1]);
                return cpl(date, index);
            case "hiwrap":
                if(!this.hiwrap_dates.includes(date)) return null;
                return hiwrap(date, index);
            case "nexradKATX":
                if(!this.nexradKATX_dates.includes(date)) return null;
                return nexradKATX(date, index);
            case "nexradKRTX":
                if(!this.nexradKRTX_dates.includes(date)) return null;
                return nexradKRTX(date, index);
            case "nexradKLGX":
                if(!this.nexradKLGX_dates.includes(date)) return null;
                return nexradKLGX(date, index);
            case "npol":
                if(!this.npol_dates.includes(date)) return null;
                return npol(date, index);
            case "apu":
                if(!this.apu_dates.includes(date)) return null;
                return apu(date, index);
            case "d3rKu":
                if(!this.d3rKu_dates.includes(date)) return null;
                return d3rKu(date, index);
            case "d3rKa":
                if(!this.d3rKa_dates.includes(date)) return null;
                return d3rKa(date, index);
            case "mrr":
                if(!this.mrr_dates.includes(date)) return null;
                return mrr(date, index);
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
        return this.sortedUniqueDates([...this.crs_dates, ...this.cpl_dates, ...this.hiwrap_dates,
                                        ...this.nexradKATX_dates, ...this.nexradKRTX_dates, ...this.nexradKLGX_dates, ...this.npol_dates, ...this.apu_dates, ...this.d3rKu_dates, ...this.d3rKa_dates, ...this.mrr_dates]).map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
    }
}

let layersGen = new LayerGenerator();
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
