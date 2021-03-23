import React, { Component } from "react"
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import homePage from "./homePage";
import pageNotFound from "./pageNotFound";

class App extends Component {

  render() {

    return (
      <div>
        <Router>
          <Switch>
            <Route path="/" exact component={homePage} />
            <Route path="/fcx" exact component={homePage} />
            <Route path="*" component={pageNotFound} status={404} />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App
