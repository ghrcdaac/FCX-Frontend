import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import homePage from "./homePage";
import pageNotFound from "./pageNotFound";
import Header from "./Header";
import MissionsCards from "./MissionCards/MissionsCards";

class App extends Component {

  render() {
    const basePath = ''
    return (
      <div>
        <Header />
        <Router>
          <Switch>
            <Route path={`${basePath}`} exact component={MissionsCards} />
            <Route path={`${basePath}/goes-r-plt`} exact component={homePage} />
            <Route path="*" component={pageNotFound} status={404} />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App
