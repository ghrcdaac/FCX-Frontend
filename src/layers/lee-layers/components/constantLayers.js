import { dataBaseUrl } from "../../../config"

const campaign = "lee"

const logo = `missions-logos/lee.png`

const description =
  "The NSF-sponsored Lake-Effect Electrification (LEE) field campaign documented the total lightning and electrical charge structures of lake-effect storms east of Lake Ontario using lightning mapping arrays, a mobile dual-polarization X-band radar, and balloon-based soundings. Intensive observation periods occurred between November 2022 and February 2023."

const dois = []

const links = [
  {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/lee",
    title: "Landing Page",
  },
  {
    url: "http://catalog.eol.ucar.edu/lee",
    title: "EOL Project Catalog",
  },
  {
    url: "https://www.eol.ucar.edu/field_projects/lee",
    title: "EOL Project Page",
  },
]

const legends = {
  leemobileradar: {
    url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_stations_legend.png`,
    color: "lightred",
  },
}

const defaultCamera = {}

export { campaign, logo, description, dois, links, legends, defaultCamera }
