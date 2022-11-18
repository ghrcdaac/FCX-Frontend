import React, { Component } from "react";
import { connect } from "react-redux";
import moment from "moment/moment";
import { JulianDate } from "cesium";

import { Post } from "../../constants/thunk";
import { Resources, mapStateToProps } from "./redux";

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';

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
        // first call the endpoint
        const { triggerSubsettingTool } = Resources;
        let xxx = Post(triggerSubsettingTool);
        this.props.dispatch(xxx);
        // update the redux state; not exactly necessary for now. but, will be handy later.
        // then change the state
        this.setState({start: "", end: ""});
    }

    render() {
      return (
        <div>
            <div style={{marginBottom: "20px"}}>
                <b>Outputs</b><br/>
                    Start: {this.state.start && this.isoToGeroian(this.state.start)}<br/>
                    End:   {this.state.end && this.isoToGeroian(this.state.end)}<br/>
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
  
export default connect(null, null)(SubsettingTool);
  