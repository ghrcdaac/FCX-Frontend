import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { isEmpty } from "lodash"

import Viz from "./Viz"

import { getCampaignInfo } from "../layers/layers"
import { deepFreeze } from "../helpers/objectHelpers"

const VizContainer = () => {
  const { id } = useParams()
  const [campaign, setCampaign] = useState({})
  
  useEffect(() => {
    const campaign = getCampaignInfo(id)
    deepFreeze(campaign)
    setCampaign(campaign)  
  }, [id])

  return (
    isEmpty(campaign)
      ? null
      : <Viz campaign={campaign}/> 
  )
}

export default VizContainer