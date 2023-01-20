import React, { Component } from "react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import ListItem from '@material-ui/core/ListItem';

import {HistogramVizBox} from "./components";
import handleFEGSdata from "./helper/handleFEGSdata";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
);

// let rawData = {
//     "data": {
//         "type": "data_pre_process_response",
//         "attributes": {
//             "message": "Subsetting lambda function invoked.",
//             "data": "{\"columns\": [\"peak\"], \"index\": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200], \"data\": [0.000742, 0.000486, 0.000389, 0.001074, 0.00037, 0.00044, 0.012316, 0.000413, 0.000403, 0.027203, 0.000448, 0.002736, 0.000556, 0.001334, 0.003914, 0.052872, 0.000456, 0.00035, 0.000483, 0.002499, 0.000341, 0.001235, 0.000356, 0.004567, 0.000409, 0.003133, 0.022221, 0.01236, 0.001268, 0.057523, 0.000239, 0.00946, 0.001496, 0.000848, 0.000454, 0.000401, 0.00116, 0.00071, 0.021778, 0.002147, 0.007085, 0.006499, 0.002932, 0.002554, 0.014491, 0.000491, 0.000809, 0.000252, 0.00041, 0.059846, 0.000225, 0.000303, 0.000373, 0.0016, 0.000847, 0.004996, 0.007203, 0.009232, 0.000492, 0.00073, 0.004012, 0.00047, 0.007992, 0.114051, 0.000445, 0.002258, 0.002724, 0.000378, 0.02413, 0.000462, 0.000551, 0.000439, 0.000428, 0.039975, 0.000472, 0.00469, 0.002757, 0.01317, 0.000819, 0.000179, 0.011025, 0.000613, 0.001304, 0.000274, 0.000265, 0.018786, 0.010435, 0.000431, 0.000686, 0.004138, 0.001405, 0.005627, 0.013871, 0.001252, 0.038021, 0.000663, 0.000906, 0.002255, 0.0003, 0.016652, 0.002081, 0.020046, 0.0065, 0.000403, 0.063212, 0.008328, 0.007987, 0.020385, 0.005085, 0.015199, 0.022536, 0.003784, 0.001122, 0.038022, 0.001229, 0.004202, 0.01437, 0.002787, 0.01142, 0.025607, 0.006054, 0.004134, 0.000399, 0.011095, 0.016486, 0.002763, 0.000536, 0.00128, 0.003671, 0.000347, 0.002101, 0.000953, 0.002007, 0.010074, 0.000555, 0.005029, 0.001191, 0.00363, 0.000629, 0.003588, 0.00086, 0.001138, 0.000672, 0.002844, 0.008487, 0.002225, 0.005393, 0.000533, 0.000357, 0.005491, 0.000934, 0.000436, 0.002273, 0.000479, 0.00602, 0.000658, 0.000733, 0.002421, 0.004962, 0.00029, 0.007595, 0.006719, 0.000976, 0.00231, 0.014609, 0.000494, 0.000509, 0.002338, 0.000407, 0.002113, 0.0057, 0.041221, 0.000249, 0.000548, 0.001121, 0.000423, 0.004155, 0.000424, 0.00039, 0.230049, 0.000377, 0.002944, 0.000686, 0.000473, 0.009102, 0.001239, 0.004531, 0.002262, 0.00366, 0.003121, 0.00292, 0.003218, 0.006469, 0.002684, 0.001184, 0.002256, 0.0004, 0.00065, 0.017706, 0.000759]}"
//         }
//     }
// }

// let data = {
//     labels: JSON.parse(rawData["data"]["attributes"]["data"])["index"],
//     datasets: [
//       {
//         label: 'Peak',
//         data: JSON.parse(rawData["data"]["attributes"]["data"])["data"],
//         backgroundColor: 'rgba(255, 99, 132, 0.5)',
//       }
//     ],
//   };

// let labels = {
//     xaxis: "FlashID",
//     yaxis: JSON.parse(rawData["data"]["attributes"]["data"])["columns"][0]
// }

async function InstrumentsHandler(instrumentType, datetime, pagesize, pageno, density) {
    /**
     * InstrumentType: We can easily get the instrument type from local state.
     * datetime: value needs to be fetched. Hard without redux thunk! Think!! actually wont have used redux thunk for this. would directly set the change on the redux state.
     *           So, it wont be dependent on the GHRC4145 merge
     * coordType: put it constant for now, later can make it selectable (using dropdown).
     * dataType: put it constant for now, later can make it selectable (using dropdown).
     * params: varies according to the instrument type. For certain insturments, need to fetch another set of data. Use that fetched data for a select option.
     * pagesize: a text field to edit the page size.
     * pageno: a next button, to fetch next set of paged data.
     * density: a stepwise slider to set the density value.
     */
    if (instrumentType == "FEGS") {
        return handleFEGSdata(datetime, pagesize, pageno, density);
    }
    return handleFEGSdata(datetime, pagesize, pageno, density);
}

class InstrumentsHistogram extends Component {
    /**
    * A base container class to display various histograms.
    * @extends React.Component
    */

    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
            selectedInstrument: "FEGS",
            datetime: "2017-03-21", //later get it from redux store
            pagesize: "200",
            pageno: "1",
            density: "1",
            // below depend on the type of instrument selected.
            coordType: "FlashID", // const thing for a instrument type, for now. Later make it selectable???
            dataType: "peak", // const thing for a instrument type, for now. Later make it selectable???
            params: "None", // only for certain instruments
            data: "",
            labels: ""
        };
    }

    componentDidMount() {
        // using the inital state, fetch the data and labels and set it in state
        let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
        InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
            let {data, labels} = res;
            this.setState({data, labels});
        });
    }

    handleInstrumentSelectionClick = (event) => {
        this.setState({anchorEl: event.currentTarget});
    };

    handleInstrumentSelectionSaveAndClose = (event) => {
        event.stopPropagation();
        this.setState({selectedInstrument: event.target.innerHTML, anchorEl: null}).then(() => {
            let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
            InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
                let {data, labels} = res;
                this.setState({data, labels});
            });
        });
    };

    handleInstrumentSelectionClose = (event) => {
        event.stopPropagation();
        this.setState({anchorEl: null});
    };

    render() {
      return (
        <div>
            Instrument: <Button aria-controls="simple-menu" aria-haspopup="true" onClick={this.handleInstrumentSelectionClick}>
                {this.state.selectedInstrument}
            </Button>
            <Menu
            id="simple-menu"
            anchorEl={this.state.anchorEl}
            keepMounted
            open={Boolean(this.state.anchorEl)}
            onClose={this.handleInstrumentSelectionClose}
            >
                <ListItem onClick={this.handleInstrumentSelectionSaveAndClose} value="FEGS">FEGS</ListItem>
                <ListItem onClick={this.handleInstrumentSelectionSaveAndClose} value="LIP">LIP</ListItem>
                <ListItem onClick={this.handleInstrumentSelectionSaveAndClose} value="CRS">CRS</ListItem>
                <ListItem onClick={this.handleInstrumentSelectionSaveAndClose} value="CPL">CPL</ListItem>
            </Menu>
            {this.state.data && this.state.labels} && {<HistogramVizBox labels={this.state.labels} data={this.state.data}/>}
        </div>
      )
    }
}
  
export default InstrumentsHistogram;
  