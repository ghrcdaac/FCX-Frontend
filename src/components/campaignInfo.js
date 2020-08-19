import React from "react"
import { FiExternalLink } from "react-icons/fi"
import campaign from "../layers"

function CampaignInfoLinks() {
  const links = []

  for (const [itemIndex, itemValue] of campaign.links.entries()) {
    links.push(
      <div key={"campaignInfo-" + itemIndex}>
        <FiExternalLink />{" "}
        <a target="_blank" rel="noopener noreferrer" href={itemValue.url}>
          {itemValue.title}
        </a>
      </div>
    )
  }
  return links
}

export default CampaignInfoLinks
