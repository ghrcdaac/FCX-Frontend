import { useHistory, withRouter } from "react-router"

import { missions } from './missions.json'
import Card from "./Card"
import '../../css/cards.css'

const MissionsCards = () => {

  const history = useHistory()
  
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
            args={[path]}
          />

        ))
      }
    </div>)
}

export default withRouter(MissionsCards)