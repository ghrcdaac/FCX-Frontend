import { dataBaseUrl } from "../../../config"

// CONSTANT VARIABLES (not changing) of a campaign

const campaign = "olympex";

const logo = `missions-logos/olympex.png`;

const description = "The GPM Ground Validation field campaign the Olympic Mountains Experiment (OLYMPEX) was held in the Pacific Northwest. The goal of OLYMPEX was to validate rain and snow measurements in midlatitude frontal systems as they move from ocean to coast to mountains.";

// External link to Data over internet
const dois = [
    {
      shortName: "goesrpltcrs",
      longName: "GPM Ground Validation Cloud Radar System (CRS) OLYMPEX V1",
      doi: "https://cmr.earthdata.nasa.gov/search/concepts/C1979140648-GHRC_DAAC.html",
    }
]

// External links to the campaign. 
// ref. used in Links
const links = [
    {
      url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/olympex",
      title: "Landing Page",
    },
    {
      url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/olympex/data_access",
      title: "Data Access",
    },
    {
      url: "https://ghrc.nsstc.nasa.gov/uso/ds_details/collections/gpmolyxC.html",
      title: "Collection DOI",
    },
    {
      url: "http://olympex.atmos.washington.edu/",
      title: "University of Washington OLYMPEX site",
    },
    {
      url: "https://ghrc.nsstc.nasa.gov/home/micro-articles/olympic-mountains-experiment-olympex",
      title: "Micro Article",
    },
    {
      url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/OLYMPEX/instruments",
      title: "Instruments",
    }
]

// Used as a reference to various instruments legend pictures.
const legends = {
    goesrpltcrs: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`, color: "magenta" },
    goesrpltcpl: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`, color: "magenta" },
    track: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/flighttrack_legend.png`, color: "darkgreen" },
    abi_c13: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/abi_c13_legend.png`, color: "lightgray" },
    lma_stations: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_stations_legend.png`, color: "lightred" },
    goesrpltwtlma: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightblue" },
    goesrpltksclma: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightblue" },
    goesrpltsolma: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightblue" },
    goesrpltcolma: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightblue" },
    goesrpltnalma:  { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightblue" },
    glm:            { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/glm_legend.png`, color: "lightgreen" },
    goesrpltfegs:   { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/fegs_legend.png`, color: "lightgreen" },
    goesrpltlip:    { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lip_legend.png`, color: "red" },
    glm_intensity:  { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/glm_legend.png`, color: "yellow" },
    isslis:         { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/isslis_legend.png`, color: "cyan" },
    goesrpltoklma:   { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lma_legend.png`, color: "lightred" },
}

// Camera position in cesium world
const defaultCamera = {
    "2017-05-14": {
      position: { x: 2178874.724313431, y: -6252303.521673192, z: 2830275.025980942 },
      direction: { x: -0.6397966148728539, y: 0.7196893691232018, z: 0.26964328949240535 },
      up: { x: -0.21680367143594015, y: -0.5056113590934348, z: 0.8350768357508109 },
      right: { x: 0.7373306311615802, y: 0.47581967753208537, z: 0.47951973350856814 },
      currentTime: { dayNumber: 2457888, secondsOfDay: 3755.5650040790497 },
    }
}

export { campaign, logo, description, dois, links, legends, defaultCamera }