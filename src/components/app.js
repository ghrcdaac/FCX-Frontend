import React, { Component } from "react"
import { Switch, Route } from 'react-router-dom'
import { MemoryRouter } from "react-router";
import VizContainer from "./VizContainer";
import PageNotFound from "./pageNotFound";
import Header from "./Header";
import MissionsCards from "./MissionCards/MissionsCards";
import { missions } from "./MissionCards/missions.json"
import { supportEmail } from "../config"
import { basePath } from '../constants/enum'
import ActivationTimeline from "./ActivationTimeline/timeline";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timelinePopup: false
    };
  }

  handleMissionTimeline = () => {
    this.setState({timelinePopup: !this.state.timelinePopup})
  }

  render() {
    return (
      <MemoryRouter>
        <Header handleMissionTimeline = {this.handleMissionTimeline}/>
        <Switch>
          <Route
            exact path={`${basePath}/:id`}
            render={(props) => {
              return <VizContainer
                missions={missions}
                {...props}
              />
            }}
          />
          <Route
            // exact path={`${basePath}`}
            path={`*`}
            render={() => <MissionsCards missions={missions}/>}
          />
          <Route
            path="*"
            status={404}
            render={() => (
              <PageNotFound
                title={`Page Not Found`}
                message={`404 Error`}
                description={`This page doesn't exists! Please check the url and try again. Please contact support team at ${supportEmail}`}
              />
            )}
          />
        </Switch>
        {this.state.timelinePopup === true ? (
          <ActivationTimeline handleMissionTimeline = {this.handleMissionTimeline}/>
        ):(
          ''
        )}
      </MemoryRouter>
    )
  }
}

export default App
