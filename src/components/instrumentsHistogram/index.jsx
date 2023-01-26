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
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Menu from '@material-ui/core/Menu';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

import {HistogramVizBox} from "./components";
import handleFEGSdata from "./helper/handleFEGSdata";
import handleLIPdata from "./helper/handleLIPdata";
import {fetchCRSData as handleCRSdata, fetchCRSparams} from "./helper/handleCRSdata";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
);

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
    } else if (instrumentType == "LIP") {
        return handleLIPdata(datetime, pagesize, pageno, density);
    } else if (instrumentType == "CRS") {
        let params="1011.825";
        return handleCRSdata(datetime, params, pagesize, pageno, density);
    }
    return handleFEGSdata(datetime, pagesize, pageno, density);
}

const densityMarks = [
    {
      value: 0.2,
      label: '20%',
    },
    {
      value: 0.5,
      label: '50%',
    },
    {
      value: 1.0,
      label: '100%',
    }
  ];

class InstrumentsHistogram extends Component {
    /**
    * A base container class to display various histograms.
    * @extends React.Component
    */

    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
            selectedInstrument: "CRS",
            datetime: "2017-05-17", //later get it from redux store
            pagesize: 20,
            pageno: 1,
            density: 1,
            // below depend on the type of instrument selected.
            coordType: "FlashID", // const thing for a instrument type, for now. Later make it selectable???
            dataType: "peak", // const thing for a instrument type, for now. Later make it selectable???
            params: "None", // only for certain instruments
            data: null,
            labels: null,
            paramsList: null
        };
    }

    componentDidMount() {
        // using the inital state, fetch the data and labels and set it in state
        this.fetchDataAndUpdateState();
    }

    fetchDataAndUpdateState = () => {
        // Do the following steps to preprare necessary data before handling the vizs specific to a instrument.
        let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
        if (selectedInstrument == "CRS" && this.state.paramsList==null) {
            fetchCRSparams(datetime).then((data) => {
                this.setState({paramsList: data});
            });
        }
        InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
            let {data, labels} = res;
            this.setState({data, labels});
        });
    }

    handleInstrumentSelectionClick = (event) => {
        event.stopPropagation();
        this.setState({anchorEl: event.currentTarget});
    };

    handleInstrumentSelectionSaveAndClose = (event) => {
        // after a new instrument is selected for the histogram viz, do the following steps.
        event.stopPropagation();
        this.setState({selectedInstrument: event.target.innerHTML,
            anchorEl: null,
            data: null,
            labels: null,
            paramsList: null,
            params: "None"
        }, function () { return this.fetchDataAndUpdateState() });
    };

    handleParamsSelection = (event) => {
        event.stopPropagation();
        this.setState({params: event.target.value});
    }

    handleInstrumentSelectionClose = (event) => {
        event.stopPropagation();
        this.setState({anchorEl: null});
    };

    handleSizePerPage = (event) => {
        event.stopPropagation();
        let pagesize = event.target.value;
        if (pagesize > 0) this.setState({ pagesize });
    }

    handleSizePerPageSumbit = (event) => {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.stopPropagation();
            this.fetchDataAndUpdateState();
        }
    }

    handlePageBack = () => {
        this.setState((prevState, props) => {
        if ((prevState.pageno > 1)) return ({
            pageno: prevState.pageno - 1
          })
        }, function () {
            return this.fetchDataAndUpdateState();
        });
    }

    handlePageNext = () => {
        this.setState((prevState, props) => {
            if (prevState.data && (prevState.data.datasets[0].data.length !== 0) && (prevState.data.labels.length !== 0)) {
              return { pageno: prevState.pageno + 1 }
            }
        }, function () {
                return this.fetchDataAndUpdateState();
              });
        }

    handleDensity = (event, density) => {
        event.stopPropagation();
        this.setState({ density }, function () { return this.fetchDataAndUpdateState() });
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
            {
                (this.state.selectedInstrument == "CRS") &&
                <div className="histogram-params-selection">
                    <TextField
                        id="outlined-select-currency"
                        select
                        label="params"
                        value={this.state.params}
                        onChange={this.handleParamsSelection}
                        // helperText="Please select params"
                        variant="outlined"
                        >
                        {this.state.paramsList && this.state.paramsList.length > 0 && this.state.paramsList.map((elem) => (
                            <MenuItem key={elem} value={elem}>
                            {elem}
                            </MenuItem>
                        ))}
                    </TextField>
                </div>
            }
            <div className="histogram-sampling-box">
                <ButtonGroup size="small" aria-label="large outlined primary button group">
                    <Button
                        color="default"
                        onClick={this.handlePageBack}
                    > Back </Button>
                    <Button
                        color="primary"
                        onClick={this.handlePageNext}
                    > Next </Button>
                </ButtonGroup>
                <div className="histogram-density-slider">
                    {/* <Typography id="discrete-slider-small-steps" gutterBottom>
                    Density
                    </Typography> */}
                    <Slider
                    defaultValue={0.50}
                    aria-labelledby="discrete-slider-small-steps"
                    step={null}
                    marks={densityMarks}
                    min={0.0}
                    max={1.0}
                    valueLabelDisplay="auto"
                    onChange={this.handleDensity}
                    />
                </div>
                <TextField
                    inputProps={{type: "number"}}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    id="outlined-number"
                    label="Data Per page"
                    value={this.state.pagesize}
                    min={1}
                    onChange={this.handleSizePerPage}
                    onKeyPress={this.handleSizePerPageSumbit}
                    variant="outlined"
                />
            </div>
            {(this.state.data && this.state.labels) ?
             <HistogramVizBox labels={this.state.labels} data={this.state.data}/> :
             "Loading..."
            }
        </div>
      )
    }
}
  
export default InstrumentsHistogram;
  