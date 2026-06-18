import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default function bufrSoundings(date, index) {
  return {
    layerId: `${date}-${index}-bufr-soundings`,
    fieldCampaignName: "LEE",
    shortName: "leebufrsoundings",
    addOnTickEventListener: true,
    displayName: "BUFR Soundings",
    variableName: "Atmospheric Profile",
    czmlLocation: `${newFieldCampaignsBaseUrl}/LEE/BUFR_Soundings/${date.replace(/-/g, "")}/knit.czml`,
    date,
    type: "instrument",
    platform: "ground",
    displayMechanism: "czml",
  }
}
