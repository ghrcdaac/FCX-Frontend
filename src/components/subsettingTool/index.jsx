import React, { Component } from "react";
import { connect } from "react-redux";
import moment from "moment/moment";
import { JulianDate } from "cesium";

import * as thunk from "../../constants/thunk";
import { Resources, mapStateToProps } from "./redux";
import { bodyForPost, validationCheck } from "./helper";

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import TextField from '@material-ui/core/TextField';

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
        if (!validationCheck(start, end, this.validationMessageSet)) return;
        const { triggerSubsettingTool } = Resources;
        triggerSubsettingTool.body = bodyForPost(start, end);
        this.props.Post(triggerSubsettingTool); // Note: updating the redux state, implicitly done, by POST thunk. Cool!
        this.setState({start: "", end: "", validationMessage: ""});
    }

    validationMessageSet = (message) => {
        this.setState({validationMessage: message})
    }

    render() {
      return (
        <div>
            <div>
                <TextField id="standard-basic" style={{width: "100%"}} label="Start:" value={this.state.start && this.isoToGeroian(this.state.start)} />
                <TextField id="standard-basic" style={{width: "100%"}} label="End:" value={this.state.end && this.isoToGeroian(this.state.end)} />
                <FormHelperText error={true}>{this.state.validationMessage}</FormHelperText>
            </div>
            <div className="center_horizontally_child">
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
  