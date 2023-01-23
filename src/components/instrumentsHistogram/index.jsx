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

const densityMarks = [
    {
      value: 0.1,
      label: '10%',
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
            datetime: "2017-03-21", //later get it from redux store
            pagesize: 200,
            pageno: 1,
            density: 1,
            // below depend on the type of instrument selected.
            coordType: "FlashID", // const thing for a instrument type, for now. Later make it selectable???
            dataType: "peak", // const thing for a instrument type, for now. Later make it selectable???
            params: "None", // only for certain instruments
            data: null,
            labels: null
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

    handlePageBack = () => {
        this.setState((prevState, props) => {
        if ((prevState.pageno > 1)) return ({
            pageno: prevState.pageno - 1
          })
        }, function () {
            let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
                InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
                    let {data, labels} = res;
                    this.setState({data, labels});
                });
        });
    }

    handlePageNext = () => {
        this.setState((prevState, props) => ({
                pageno: prevState.pageno + 1
              }), function () {
                let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
                InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
                    let {data, labels} = res;
                    this.setState({data, labels});
                });
              });
        }

    handleDensity = (event, density) => {
        this.setState({ density }, function () {
            let {selectedInstrument, datetime, pageno, pagesize, density} = this.state;
            InstrumentsHandler(selectedInstrument, datetime, pagesize, pageno, density).then((res)=> {
                let {data, labels} = res;
                this.setState({data, labels});
            });
          });
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
            <div>
                <Typography id="discrete-slider-small-steps" gutterBottom>
                  Density
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
                />
            </div>
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
            {(this.state.data && this.state.labels) ?
             <HistogramVizBox labels={this.state.labels} data={this.state.data}/> :
             "Loading..."
            }
        </div>
      )
    }
}
  
export default InstrumentsHistogram;
  