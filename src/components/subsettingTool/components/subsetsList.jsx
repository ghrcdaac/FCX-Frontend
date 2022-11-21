import React, { Component } from "react";
import { connect } from "react-redux";
import { Resources, mapStateToProps } from "../redux";

import RecipeReviewCard from "./card";

class SubsetsList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
      return (
        <div>
            <RecipeReviewCard/>
        </div>
      )
    }
}
  
export default connect(mapStateToProps, null)(SubsetsList);
  