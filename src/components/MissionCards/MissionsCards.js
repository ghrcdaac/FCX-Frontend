import { useHistory, withRouter } from "react-router"

import Card from "./Card"
import '../../css/cards.css'

const MissionsCards = ({ missions }) => {

  const history = useHistory()
  const basePath = '/fcx'
  return (
    <div className="mission-card-group">
      {
        missions.map(({ name, description, image, dates, landingPageURL, path }) => (
          <Card
            key={name}
            imageUrl={`missions-logos/${image}`}
            name={name}
            description={description}
            reference={landingPageURL}
            dates={dates}
            onClickHandler={history.push}
            args={[`${basePath}${path}`]}
          />

        ))
      }
    </div>)
}

export default withRouter(MissionsCards)