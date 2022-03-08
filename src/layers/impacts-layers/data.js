import { dataBaseUrl } from "../../config"

const crs_er2       = [
//   "2020-02-27 07:43:50	2020-02-27 14:23:21",
//   "2020-02-25 20:29:26	2020-02-26 03:11:41",
//   "2020-02-07 12:22:27	2020-02-07 18:01:09",
//   "2020-02-05 19:23:24	2020-02-06 00:49:25",
//   "2020-02-01 11:33:22	2020-02-01 15:55:05",
//   "2020-01-25 18:19:54	2020-01-26 00:32:01",
]

const lip_er2       = [
  // "2020-02-27 07:00:43	2020-02-27 15:27:03",
  // "2020-02-25 19:43:43	2020-02-26 04:12:16",
  // "2020-02-23 16:12:00	2020-02-23 19:15:29",
  "2020-02-07 11:46:43	2020-02-07 19:07:07",
  // "2020-02-05 18:41:00	2020-02-06 01:52:13",
  "2020-02-01 10:51:43	2020-02-01 17:22:10",
  // "2020-01-25 17:24:43	2020-01-26 01:38:28",
  "2020-01-18 16:56:43	2020-01-18 21:18:04",
  // "2020-01-15 17:09:43	2020-01-15 22:50:25",
]

const cpl_er2       = [
//   "2020-03-02 15:49:11	2020-03-02 20:17:51",
//   "2020-02-27 08:17:50	2020-02-27 14:22:55",
//   "2020-02-25 20:29:21	2020-02-26 03:11:20",
//   "2020-02-23 16:55:15	2020-02-23 18:05:45",
//   "2020-02-07 13:29:06	2020-02-07 18:01:08",
//   "2020-02-05 19:23:20	2020-02-06 00:49:20",
//   "2020-02-01 11:33:15	2020-02-01 15:55:03",
//   "2020-01-25 18:53:12	2020-01-25 23:28:08",
//   "2020-01-18 17:40:33	2020-01-18 20:18:54",
//   "2020-01-15 17:55:40	2020-01-15 21:33:13",
]

const hiwrap_er2    = [
  // "2020-02-27 07:43:38	2020-02-27 14:22:38",
  "2020-02-25 20:29:29	2020-02-26 03:01:12",
  "2020-02-07 12:22:21	2020-02-07 18:00:45",
  "2020-02-05 19:23:21	2020-02-06 00:48:35",
  "2020-02-01 11:33:16	2020-02-01 15:52:57",
  "2020-01-25 18:19:52	2020-01-26 00:30:40",
]

const flight_er2    = [
  // "2020-03-02 15:24:04	2020-03-02 20:48:31",
  // "2020-02-27 07:21:29	2020-02-27 15:17:57",
  // "2020-02-25 20:06:39	2020-02-26 03:57:48",
  // "2020-02-23 16:31:39	2020-02-23 19:05:32",
  "2020-02-07 12:04:21	2020-02-07 18:52:35",
  "2020-02-05 18:59:12	2020-02-06 01:35:42",
  "2020-02-01 11:09:00	2020-02-01 17:09:20",
  "2020-01-25 17:49:01	2020-01-26 01:25:55",
  "2020-01-18 17:14:58	2020-01-18 21:07:18",
  // "2020-01-15 17:29:01	2020-01-15 22:37:00",
]

const flight_p3b    = [
  "2020-02-25 20:57:55	2020-02-26 04:12:30",
  // "2020-02-24 17:50:45	2020-02-24 19:28:40",
  "2020-02-20 19:39:12	2020-02-21 01:12:20",
  "2020-02-18 17:21:44	2020-02-18 22:15:19",
  "2020-02-13 06:11:50	2020-02-13 12:41:30",
  "2020-02-07 14:05:47	2020-02-07 20:01:45",
  "2020-02-05 18:30:11	2020-02-06 01:40:15",
  "2020-02-01 11:30:54	2020-02-01 15:39:55",
  "2020-01-25 18:52:44	2020-01-26 00:29:02",
  "2020-01-18 18:01:07	2020-01-19 00:04:45",
  // "2020-01-12 18:25:28	2020-01-12 22:06:16",
]

const defaultCamera = {

}

const legends       = {
  crs: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`, color: "magenta" },
  cpl: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`, color: "magenta" },
  lip: { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lip_legend.png`, color: "red" },
  track:       { url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/flighttrack_legend.png`, color: "darkgreen" },

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
  flight_er2,
  flight_p3b,
  defaultCamera,
  legends,
  links,
  dois,
  campaign,
  description
}