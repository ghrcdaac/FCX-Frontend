import React, { Component } from "react"

class pageNotFound extends Component {

    render() {

        return (
            <div className="error-page">
                <span className="error-message">404</span>
                <span className="error-line1">Not Found</span>
                <br></br>
                <span className="error-line2">The page requested cannot be found!</span>

            </div>
        )
    }
}

export default pageNotFound
