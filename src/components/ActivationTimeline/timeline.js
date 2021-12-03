import React from 'react'
import Typography from "@material-ui/core/Typography"
import { sortMissionsByTimeline } from "../../helpers/apiHelpers"
import { compareMissionsByTimeline } from "../../helpers/apiHelpers"
import { missions } from "../MissionCards/missions.json"
import '../../css/activationTimeline.css'
import { useHistory, withRouter } from "react-router"
import { basePath } from '../../constants/enum'

const Timeline = ({handleMissionTimeline}) => {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
  const cardName = 'mission'
  const sortedMissions = sortMissionsByTimeline(missions)
  const history = useHistory()

  return (
    <>
      <div id = 'container'>
        <div id = 'title'>
          <br/>
          <Typography variant="h3" noWrap>
            Activation Timeline
          </Typography>
          <br/>
        </div>
        <div className = {`${cardName}-container`}>
          {sortedMissions.map((mission) => (
            <div className = {`${cardName}`} key = {mission.id}>
              <div className = {`${cardName}-data-container`}>
                {
                  compareMissionsByTimeline(mission.timeline) === true ? (
                    <h3 style = {{color: 'limegreen'}}> Active Since:{' '}{mission.timeline} </h3>
                  ):(
                    <h3 style = {{color: 'red'}}> Projected Activation:{' '}{mission.timeline} </h3>
                  )
                }
                <div className = {`${cardName}-data`}>
                  <div className = 'side'>
                    <img
                      src={`missions-logos/${mission.image}`}
                      alt={mission.name}
                      className={`${cardName}-logos`}
                    />
                  </div>
                  <div className = {`${cardName}-name-container`}>
                    <h3
                      className = {`${cardName}-name`}
                      onClick={() => {
                        handleMissionTimeline()
                        history.push(`${basePath}${mission.path}`)
                      }}
                    >
                      {mission.name}
                    </h3>
                    {
                      compareMissionsByTimeline(mission.timeline) === true ? (
                        <span 
                          style ={{animationName: 'color-active'}}
                          className = {`${cardName}-node`}>
                        </span>
                      ):(
                        <span 
                          style ={{animationName: 'color-inactive'}}
                          className = {`${cardName}-node`}>
                        </span>
                      )
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default withRouter(Timeline)