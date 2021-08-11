import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import VizContainer from "./VizContainer";
import pageNotFound from "./pageNotFound";
import Header from "./Header";
import MissionsCards from "./MissionCards/MissionsCards";

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
              render={(props) => <VizContainer {...props}/>}
            />
            <Route path={`${basePath}`} exact component={MissionsCards} />
            <Route path="*" component={pageNotFound} status={404} />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App
