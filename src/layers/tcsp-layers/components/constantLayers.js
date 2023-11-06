import { dataBaseUrl } from "../../../config"

const campaign = "tcsp";

const logo = 'missions-logos/tcsp.png';

const description = "This is TCSP";

const dois = [
    {
      shortName: "tcspflightnav",
      longName: "TCSP ER-2 Navigation Data V1",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979949563-GHRC_DAAC.html",
    },
    {
      shortName: "tcsplip",
      longName: "TCSP LIP data",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979949563-GHRC_DAAC.html",
    }
]

const links = []

const legends = {
    track: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/flighttrack_legend.png`, color: "darkgreen" },
    goesrpltlip: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lip_legend.png`, color: "red" }
}

const defaultCamera = {}

export { campaign, logo, description, dois, links, legends, defaultCamera }