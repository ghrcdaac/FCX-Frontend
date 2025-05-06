import { flighttrack, lip, crs } from "./helpers";

class LayerGenerator {
    constructor() {
        this.instruments = ["lip", "flighttrack", "crs"]; // add new instrument name here
        this.crs_dates = ["2005-07-05", "2005-07-15", "2005-07-16", "2005-07-23", "2005-07-24", "2005-07-25", "2005-07-27"];
        this.lip_dates = ["2005-07-05", "2005-07-17", "2005-07-09", "2005-07-27", "2005-07-06", "2005-07-16", "2005-07-15", "2005-07-24", "2005-07-23", "2005-07-25"];
        this.flighttrack_dates = ["2005-07-05", "2005-07-17", "2005-07-09", "2005-07-27", "2005-07-06", "2005-07-16", "2005-07-15", "2005-07-24", "2005-07-23", "2005-07-25"];
        // add dates when data for new instrument are available
    }

    sortedUniqueDates(date) {
        /**
        * @param {array} dates array of dates.
        */
        const unique = [...date].filter((value, index, array) => array.indexOf(value) === index);
        return unique.sort();
    }

    sortedOverlappingDates(date1, date2) {
        /**
       * @param {array} dates array of dates.
       */
       const overlappingElements = [];

       for (let i = 0; i < date1.length; i++) {
           if (date2.includes(date1[i])) {
               overlappingElements.push(date1[i]);
           }
       }
       return overlappingElements.sort();
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
            case "flighttrack":
                if (!this.flighttrack_dates.includes(date)) return null;
                return flighttrack(date, index);
            case "lip":
                if(!this.lip_dates.includes(date)) return null;
                return lip(date, index);
            case "crs":
                if(!this.crs_dates.includes(date)) return null;
                return crs(date, index);
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
        return this.sortedUniqueDates([...this.flighttrack_dates,...this.lip_dates,...this.crs_dates]).map(date => ({
            date,
            items: this.instruments.map((instrum, index) => this.getInstrumentsItem(date, instrum, index)).filter(n => n)
        }));
        // return {
        //     date: this.flighttrack_dates,
        //     items: this.getInstrumentsItem(this.flighttrack_dates, this.instrument, 0) // Assuming you want to keep the index as 0
        // };
    }
}

let layersGen = new LayerGenerator();
let instrumentLayers = layersGen.generateLayer();

export default instrumentLayers;
