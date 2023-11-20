import { dataBaseUrl } from "../../../config"

const campaign = "tcsp";

const logo = 'missions-logos/tcsp.png';

const description = "12 NASA ER-2 science flights included missions to Hurricanes Dennis and Emily, Tropical Storm Gert, and an eastern Pacific mesoscale complex that may possibly have further developed into Tropical Storm Eugene. Costa Rica, July 1-27, 2005.";

const dois = [
    {
      shortName: "tcspflightnav",
      longName: "TCSP ER-2 Navigation Data V1",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979949563-GHRC_DAAC.html",
    },
    {
      shortName: "tcsplip",
      longName: "TCSP LIP data",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979951465-GHRC_DAAC.html",
    },
    {
      shortName: "tcspcrs",
      longName: "TCSP CRS data",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979948526-GHRC_DAAC.html",
    }
]

// External links to the campaign. 
// ref. used in Links
const links = [
  {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/tcsp",
    title: "Landing Page",
  },
  {
    url: "https://search.earthdata.nasa.gov/search?portal=ghrc&q=TCSP",
    title: "Data Access",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/uso/ds_details/collections/tcspC.html",
    title: "Collection DOI",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/home/micro-articles/field-campaign-hurricane-and-severe-storm-sentinel-hs3",
    title: "Micro Article",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/home/about-ghrc/citing-ghrc-daac-data",
    title: "Citing Data",
  }
]

const legends = {
    track: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/flighttrack_legend.png`, color: "darkgreen" },
    tcsplip: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lip_legend.png`, color: "red" },
    tcspcrs: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`, color: "magenta" },
}

const defaultCamera = {}

export { campaign, logo, description, dois, links, legends, defaultCamera }