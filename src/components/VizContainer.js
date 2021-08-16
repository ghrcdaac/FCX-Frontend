import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { isEmpty } from "lodash"

import Viz from "./Viz"

import { getCampaignInfo } from "../layers/layers"
import { deepFreeze } from "../helpers/objectHelpers"
import PageNotFound from "./pageNotFound"

const VizContainer = () => {
  const { id } = useParams()
  const [campaign, setCampaign] = useState({})
  
  useEffect(() => {
    const campaign = getCampaignInfo(id)
    if(campaign){
      deepFreeze(campaign)
      setCampaign(campaign)
    }else{
      setCampaign(null)
    } 
  }, [id])

  return (
    campaign === null
      ? <PageNotFound
          title={`UNDER CONSTRUCTION`}
          message={``}
          description={`We are working to bring this page to life!`}          
        />
      : (isEmpty(campaign)
        ? null
        : <Viz campaign={campaign} />)
      

  )
}

export default VizContainer