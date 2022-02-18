import { dataBaseUrl } from "../../config"

const crs_er2       = [
  "2020-02-27 07:43:50	2020-02-27 14:23:21",
  "2020-02-25 20:29:26	2020-02-26 03:11:41",
  "2020-02-07 12:22:27	2020-02-07 18:01:09",
  "2020-02-05 19:23:24	2020-02-06 00:49:25",
  "2020-02-01 11:33:22	2020-02-01 15:55:05",
  "2020-01-25 18:19:54	2020-01-26 00:32:01",
]

const lip_er2       = [
  "2020-02-27 07:00:43	2020-02-27 15:27:03",
  "2020-02-25 19:43:43	2020-02-26 04:12:16",
  "2020-02-23 16:12:00	2020-02-23 19:15:29",
  "2020-02-07 11:46:43	2020-02-07 19:07:07",
  "2020-02-05 18:41:00	2020-02-06 01:52:13",
  "2020-02-01 10:51:43	2020-02-01 17:22:10",
  "2020-01-25 17:24:43	2020-01-26 01:38:28",
  "2020-01-18 16:56:43	2020-01-18 21:18:04",
  "2020-01-15 17:09:43	2020-01-15 22:50:25",
]

const cpl_er2       = [
  "2020-03-02 15:49:11	2020-03-02 20:17:51",
  "2020-02-27 08:17:50	2020-02-27 14:22:55",
  "2020-02-25 20:29:21	2020-02-26 03:11:20",
  "2020-02-23 16:55:15	2020-02-23 18:05:45",
  "2020-02-07 13:29:06	2020-02-07 18:01:08",
  "2020-02-05 19:23:20	2020-02-06 00:49:20",
  "2020-02-01 11:33:15	2020-02-01 15:55:03",
  "2020-01-25 18:53:12	2020-01-25 23:28:08",
  "2020-01-18 17:40:33	2020-01-18 20:18:54",
  "2020-01-15 17:55:40	2020-01-15 21:33:13",
]

const hiwrap_er2    = [
  "2020-02-27 07:43:38	2020-02-27 14:22:38",
  "2020-02-25 20:29:29	2020-02-26 03:01:12",
  "2020-02-07 12:22:21	2020-02-07 18:00:45",
  "2020-02-05 19:23:21	2020-02-06 00:48:35",
  "2020-02-01 11:33:16	2020-02-01 15:52:57",
  "2020-01-25 18:19:52	2020-01-26 00:30:40",
]

const defaultCamera = {

}

const legends       = {
  impactscrs: { url: `${dataBaseUrl}/fieldcampaign/impacts/legend/crs_legend.png`, color: "magenta" },
  impactscpl: { url: `${dataBaseUrl}/fieldcampaign/impacts/legend/crs_legend.png`, color: "magenta" },
  impactslip: { url: `${dataBaseUrl}/fieldcampaign/impacts/legend/lip_legend.png`, color: "red" },
}

const links         = [
  {
    url: "https://ghrc.nsstc.nasa.gov/uso/ds_details/collections/impactsC.html",
    title: "Landing Page",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/home/micro-articles/investigation-microphysics-and-precipitation-atlantic-coast-threatening-snowstorms",
    title: "Micro Article",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/impacts",
    title: "Description",
  },
  {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/impacts/instruments",
    title: "Instruments",
  },
]

const dois          = [
  {
    shortName: "impactscrs",
    longName: "IMPACTS Cloud Radar System (CRS)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/CRS/DATA101",
  },
  {
    shortName: "impactscpl",
    longName: "IMPACTS Cloud Physics LiDAR (CPL)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/CPL/DATA101",
  },
  {
    shortName: "impactslip",
    longName: "IMPACTS Lightning Instrument Package (LIP)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/LIP/DATA101",
  },
]

const campaign = "IMPACTS"
const description = "IMPACTS will fly a complementary suite of remote sensing and in-situ instruments for three 6-week deployments (2020-2022) on NASA’s ER-2 high-altitude aircraft and P-3 cloud-sampling aircraft."


export {
  cpl_er2,
  crs_er2,
  lip_er2,
  hiwrap_er2,
  defaultCamera,
  legends,
  links,
  dois,
  campaign,
  description
}