import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import VizContainer from "./VizContainer";
import PageNotFound from "./pageNotFound";
import Header from "./Header";
import MissionsCards from "./MissionCards/MissionsCards";
import { missions } from "./MissionCards/missions.json"
import { supportEmail } from "../config"

class App extends Component {

  render() {
    const basePath = '/fcx'
    return (
      <Router>
        <Header />
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
            exact path={`${basePath}`}
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
      </Router>
    )
  }
}

export default App
