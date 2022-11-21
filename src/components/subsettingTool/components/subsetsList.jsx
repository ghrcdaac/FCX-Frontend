import React, { Component } from "react";
import { connect } from "react-redux";
import { mapStateToProps } from "../redux";

import RecipeReviewCard from "./card";

class SubsetsList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
      return (
        <div>
        {
            this.props.subsetsDir.map((dir, index) =>
            <RecipeReviewCard subsetDir={dir} subsetIndex={index}/>)
        }
        </div>
      )
    }
}
  
export default connect(mapStateToProps, null)(SubsetsList);
  