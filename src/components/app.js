import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import VizContainer from "./VizContainer";
import PageNotFound from "./pageNotFound";
import Header from "./Header";
import MissionsCards from "./MissionCards/MissionsCards";
import { missions } from "./MissionCards/missions.json"
import { missionExists } from "../helpers/apiHelpers"
import { supportEmail } from "../config"

class App extends Component {

  render() {
    const basePath = '/fcx'
    return (
      <div>
        <Header />
        <Router>
          <Switch>
            <Route
              path={`${basePath}/:id`}
              render={(props) => {
                return missionExists(props.match.params.id, missions)
                  ? <VizContainer {...props}/>
                  : <PageNotFound
                      title={`Page Not Found`}
                      message={`404 Error`}
                      description={`This page doesn't exists! Please check the url and try again. Please contact support team at ${supportEmail}`}
                    />  
              }}
            />
            <Route
              exact path={`${basePath}`}
              render={() => <MissionsCards missions={missions}/>}
            />
            <Route
              path="*"
              render={() => (
                <PageNotFound
                  title={`Page Not Found`}
                  message={`404 Error`}
                  description={`This page doesn't exists! Please check the url and try again. Please contact support team at ${supportEmail}`}
                />
              )}
            />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App
