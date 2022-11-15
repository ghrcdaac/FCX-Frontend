import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { JulianDate } from "cesium";

class SubsettingTool extends Component {
    constructor(props) {
        super(props);
        this.state = {
            start: "",
            end: ""
        };
    }

    componentDidMount() {
    }

    JulainToISO(julianDate) {
        // rewrite this method.
        const fdate = "2017-05-17";
        function str2d(num){ return String(num).padStart(2,'0') };
        const Time0= JulianDate.fromIso8601(fdate+"T00:00:00Z");
        const Tc = JulianDate.clone(julianDate);
        const tstart = JulianDate.secondsDifference(Tc, Time0);
        const TSh = Math.floor(tstart/3600);
        const TSm = Math.floor((tstart-TSh*3600)/60);
        const TSs = Math.floor(tstart-TSh*3600-TSm*60);
        const TstartLab = str2d(TSh)+':'+str2d(TSm)+':'+str2d(TSs)+' UTC';
        return TstartLab;
    }

    handleStart = (event) => {
        event.stopPropagation();
        // get the clock time from cesium, and assign it to start state
        console.log(this.props.cesiumViewer.viewer.clock.currentTime)
        if (this.props.cesiumViewer.viewer) {
            let currentTime = this.JulainToISO(this.props.cesiumViewer.viewer.clock.currentTime);
            this.setState({start: currentTime.toString()});
        }
    }

    handleStop = (event) => {
        event.stopPropagation();
        // get the clock time from cesium, and assign it to end state
        console.log(this.props.cesiumViewer.viewer.clock.currentTime)
        if (this.props.cesiumViewer.viewer) {
            let currentTime = this.JulainToISO(this.props.cesiumViewer.viewer.clock.currentTime);
            this.setState({end: currentTime});
        }
    }

    render() {
      return (
        <div>
            <div className="center_horizontally_child">
                <ButtonGroup disableElevation variant="contained" color="primary">
                    <Button onClick={this.handleStart}>Start</Button>
                    <Button onClick={this.handleStop}>Stop</Button>
                </ButtonGroup>
            </div>
            <div>
                Outputs:<br/>
                    Start: {this.state.start}<br/>
                    End: {this.state.end}<br/>
            </div>
        </div>
      )
    }
}
  
export default SubsettingTool;
  