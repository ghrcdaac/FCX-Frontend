import React, { Component } from "react";
import {connect} from 'react-redux';

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
import {requestBodyFEGS} from "./helper/handleFEGSdata";
import handleLIPdata from "./helper/handleLIPdata";
import {fetchCRSData as handleCRSdata, fetchCRSparams} from "./helper/handleCRSdata";
import {fetchCPLData as handleCPLdata, fetchCPLparams} from "./helper/handleCPLdata";

import { Resources, Post } from "./redux/index";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
);

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
            selectedInstrument: "FEGS",
            pagesize: 500,
            pageno: 1,
            density: 1,
            // below depend on the type of instrument selected.
            coordType: "Second", // const thing for a instrument type, for now. Later make it selectable???
            dataType: "ATB_1064", // const thing for a instrument type, for now. Later make it selectable???
            params: null,
            data: null,
            labels: null,
            paramsList: null,
            error: false
        };
    }

    componentDidMount() {
        // using the inital state, fetch the data and labels and set it in state
        this.handleDefaultParamsValue(this.state.selectedInstrument).then(() => {
            this.fetchDataAndUpdateState();
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.selectedDate !== this.props.selectedDate) {
        // using the states, fetch the data and labels and set it in state
            this.handleDefaultParamsValue(this.state.selectedInstrument).then(() => {
                this.fetchDataAndUpdateState();
            });
        }
    }

    fetchDataAndUpdateState = () => {
        // Do the following steps to preprare necessary data before handling the vizs specific to a instrument.
        let {selectedInstrument, params, pageno, pagesize, density, error} = this.state;
        let datetime = this.props.selectedDate;
        if (selectedInstrument && datetime && params && pageno && pagesize && density && !error) {
            // only fetch histogram data, once all the necessary parameters for api call are ready
            this.InstrumentsHandler(selectedInstrument, datetime, params, pagesize, pageno, density)
            // .then((res)=> {
            //     let {data, labels} = res;
            //     this.setState({data, labels});
            // });
        }
    }

    InstrumentsHandler = async (instrumentType, datetime, params, pagesize, pageno, density) => {
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
            // return handleFEGSdata(datetime, pagesize, pageno, density);
            Resources.body = requestBodyFEGS(datetime, pagesize, pageno, density);
            this.props.Post(Resources);
        } else if (instrumentType == "LIP") {
            return handleLIPdata(datetime, pagesize, pageno, density);
        } else if (instrumentType == "CRS") {
            return handleCRSdata(datetime, params, pagesize, pageno, density);
        } else if (instrumentType == "CPL") {
            return handleCPLdata(datetime, params, pagesize, pageno, density);
        }
    }

    handleInstrumentSelectionClick = (event) => {
        event.stopPropagation();
        this.setState({anchorEl: event.currentTarget});
    };

    handleDefaultParamsValue = async (selectedInstrument) => {
        if (["CRS", "CPL"].includes(selectedInstrument)) {
            // if the selected instrument is CRS or CPL, fetch the paramslist and set params to null (do not fetch the histogram data yet!!).
            this.setState({params: null}, function() {
                if (selectedInstrument == "CRS") fetchCRSparams(this.props.selectedDate).then((data) => {
                    // error handling incase no data for given date
                    if(!data["error"]) {
                        this.setState({paramsList: data["params"]});
                    } else {
                        this.setState({error: true});
                    }
                });
                else if (selectedInstrument == "CPL") fetchCPLparams(this.props.selectedDate).then((data) => {
                    // error handling incase no data for given date
                    if(!data["error"]) {
                        this.setState({paramsList: data["params"]});
                    } else {
                        this.setState({error: true});
                    }
                });
            });
        } else if (["FEGS", "LIP"].includes(selectedInstrument)) {
        // if the selected instrument is FEGS, LIP, set the param to "None" as required by the api call for these instruments (can fetch for histogram viz). 
            this.setState({params: "None"})
        } else {
            this.setState({params: null})
        }
    }

    handleInstrumentSelectionSaveAndClose = (event) => {
        // after a new instrument is selected for the histogram viz, do the following steps.
        event.stopPropagation();
        this.handleDefaultParamsValue(event.target.innerHTML);
        this.setState({selectedInstrument: event.target.innerHTML,
            anchorEl: null,
            data: null,
            labels: null,
            paramsList: null,
            error: false
        }, function () { return this.fetchDataAndUpdateState() });
    };

    handleParamsSelection = (event) => {
        event.stopPropagation();
        this.setState({params: event.target.value}, function () {
            return this.fetchDataAndUpdateState();
        });
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
            <div className="histogram-selection-box">
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
                        <Typography id="histogram-density-slider-label" gutterBottom>
                        Quantization
                        </Typography>
                        <Slider
                        defaultValue={0.50}
                        aria-labelledby="discrete-slider-small-steps"
                        step={null}
                        marks={densityMarks}
                        min={0.0}
                        max={1.0}
                        valueLabelDisplay="auto"
                        onChange={this.handleDensity}
                        label="Desnsity"
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
                {
                    (["CRS", "CPL"].includes(this.state.selectedInstrument)) &&
                    <div className="histogram-params-selection">
                        <TextField
                            id="outlined-select-currency"
                            select
                            label= {`${(this.state.selectedInstrument === "CRS") ? "range" : "Second"} (z-axis)`} // if crs, range. if cpl, Second
                            value={this.state.params}
                            onChange={this.handleParamsSelection}
                            // helperText="Please select params"
                            variant="outlined"
                            style={{width: "100%"}}
                            >
                            {this.state.paramsList && this.state.paramsList.length > 0 && this.state.paramsList.map((elem) => (
                                <MenuItem key={elem} value={String(elem)}>
                                {elem}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                }
            </div>
            {(!this.props.error && (Object.keys(this.props.data).length > 0) && Object.keys(this.props.labels).length > 0) && <HistogramVizBox labels={this.props.labels} data={this.props.data}/>}
            {(!this.props.error && !this.state.params && !this.state.paramsList) && <p>"Loading params..."</p>}
            {(!this.props.error && this.state.paramsList && !this.state.params) && <p>"Select params to visualize histogram."</p>}
            {(!this.props.error && this.state.params && !(Object.keys(this.props.data).length > 0) && !(Object.keys(this.props.labels).length > 0)) && <p>"Loading..."</p>}
            {(this.props.error) && <p>"No instrument data for selected date"</p>}
        </div>
      )
    }
}
  
export default connect((state) => {
    // map redux state to props
    let selectedLayer = state.selectedLayers[0];
    let selectedLayerDate = selectedLayer && selectedLayer.slice(0, 10);
    let {data, labels} = state.histogramTool
    return {selectedDate: selectedLayerDate, data, labels }
}, {Post})(InstrumentsHistogram);
  