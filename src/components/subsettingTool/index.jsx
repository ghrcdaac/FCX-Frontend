import React, { Component } from "react";
import { connect } from "react-redux";
import moment from "moment/moment";
import { JulianDate } from "cesium";

import * as thunk from "../../constants/thunk";
import { Resources, mapStateToProps } from "./redux";
import { bodyForPost } from "./helper";

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import FormHelperText from '@material-ui/core/FormHelperText';

class SubsettingTool extends Component {
    constructor(props) {
        super(props);
        this.state = {
            start: "",
            end: "",
            validationMessage: ""
        };
    }

    JulainToISO(julianDate) {
        let cJulianDate = JulianDate.clone(julianDate);
        let iso8601Date = JulianDate.toIso8601(cJulianDate);
        return iso8601Date;
    }

    isoToGeroian(date) {
        return moment(date).utc().format('MMMM Do YYYY, h:mm:ss a');
    }

    handleStart = (event) => {
        event.stopPropagation();
        // get the clock time from cesium, and assign it to start state
        if (this.props.cesiumViewer.viewer) {
            let currentTime = this.JulainToISO(this.props.cesiumViewer.viewer.clock.currentTime);
            let formattedCurrentTime = moment(currentTime).utc().format('YYYY-MM-DD HH:mm:ss') + " UTC";
            this.setState({start: formattedCurrentTime});
        }
    }

    handleStop = (event) => {
        event.stopPropagation();
        // get the clock time from cesium, and assign it to end state
        if (this.props.cesiumViewer.viewer) {
            let currentTime = this.JulainToISO(this.props.cesiumViewer.viewer.clock.currentTime);
            let formattedCurrentTime = moment(currentTime).utc().format('YYYY-MM-DD HH:mm:ss') + " UTC";
            this.setState({end: formattedCurrentTime});
        }
    }

    handleSubmit = (event) => {
        event.stopPropagation();
        const {start, end} = this.state;
        if (!this.validationCheck(start, end)) return;
        const { triggerSubsettingTool } = Resources;
        triggerSubsettingTool.body = bodyForPost(start, end);
        this.props.Post(triggerSubsettingTool); // Note: updating the redux state, implicitly done, by POST thunk. Cool!
        this.setState({start: "", end: "", validationMessage: ""});
    }

    validationCheck = (start, end) => {
        // check if the start end is in correct format
        if(!moment(start)) {
            this.setState({validationMessage: "Start date time format is wrong."});
            return false;
        }
        if(!moment(end)) {
            this.setState({validationMessage: "End date time format is wrong."});
            return false;
        }
        // check, end should be after start
        if((moment(start).isAfter(end))){
            this.setState({validationMessage: "End time should be greater than start time."});
            return false;
        }
        //check if the subsetting is for more than 10 seconds.
        if(moment(end).diff(moment(start), "seconds") < 10){
            this.setState({validationMessage: "A valid subset should be greater than 10 seconds."});
            return false;
        }
        return true;
    }

    render() {
      return (
        <div>
            <div>
                <b>Outputs</b><br/>
                    Start: {this.state.start && this.isoToGeroian(this.state.start)}<br/>
                    End:   {this.state.end && this.isoToGeroian(this.state.end)}<br/>
            </div>
            <FormHelperText error={true}>{this.state.validationMessage}</FormHelperText>
            <div className="center_horizontally_child" style={{marginTop: "10px"}}>
                <ButtonGroup aria-label="small outlined button group">
                    <Button onClick={this.handleStart}>Start</Button>
                    <Button onClick={this.handleStop}>Stop</Button>
                </ButtonGroup>
                <Button variant="outlined" color="primary" onClick={this.handleSubmit}> Submit </Button>
            </div>
        </div>
      )
    }
}
  
export default connect(mapStateToProps, {...thunk})(SubsettingTool);
  