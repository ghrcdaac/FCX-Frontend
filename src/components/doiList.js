import React from "react"
import { FiExternalLink } from "react-icons/fi"
import campaignInfo from "../layers"

function DOIList() {
  const links = []
  for (const [itemIndex, itemValue] of campaignInfo.dois.entries()) {
    links.push(
      <div key={"doi-" + itemIndex}>
        <FiExternalLink />{" "}
        <a target="_blank" rel="noopener noreferrer" href={itemValue.doi}>
          {itemValue.longName}
        </a>
      </div>
    )
  }
  return links
}

export default DOIList
