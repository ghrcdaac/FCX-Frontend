import React, { Component } from "react";
import { connect } from "react-redux";
import moment from "moment/moment";
import { JulianDate } from "cesium";

import * as thunk from "../../constants/thunk";
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
        const { triggerSubsettingTool } = Resources;
        triggerSubsettingTool.body = {
            body: {
                subDir: "https://szg-ghrc-fcx-viz-output.s3.amazonaws.com/subsets/subset_test11/",
                date: moment(this.state.start).utc().format('YYYY-MM-DD'),
                Start: this.state.start,
                End: this.state.end,
                latRange: "-",
                lonRange: "-",
                DataSets: [
                    {
                        id: "1",
                        cat_id: "CRS",
                        state: 1
                    },
                    {
                        id: "2",
                        cat_id: "LIP",
                        state: 1
                    },
                    {
                        id: "3",
                        cat_id: "FEGS",
                        state: 1
                    },
                    {
                        id: "4",
                        cat_id: "LMA",
                        state: 1
                    },
                    {
                        id: "5",
                        cat_id: "LIS",
                        state: 1
                    },
                    {
                        id: "6",
                        cat_id: "GLM",
                        state: 1
                    },
                    {
                        id: "7",
                        cat_id: "ABI",
                        state: 1
                    }
                ]
            }
        }
        this.props.Post(triggerSubsettingTool); // Note: updating the redux state, implicitly done, by POST thunk. Cool!
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
  
export default connect(mapStateToProps, {...thunk})(SubsettingTool);
  