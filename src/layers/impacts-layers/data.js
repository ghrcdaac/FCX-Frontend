import {dataBaseUrl} from "../../config"

const crs_er2 = [
  // "2020-02-27 07:43:50	2020-02-27 14:23:21",
  // "2020-02-25 20:29:26	2020-02-26 03:11:41",
  // "2020-02-07 12:22:27	2020-02-07 18:01:09",
  // "2020-02-05 19:23:24	2020-02-06 00:49:25",
  // "2020-02-01 11:33:22	2020-02-01 15:55:05",
  // "2020-01-25 18:19:54	2020-01-26 00:32:01",
]

const lip_er2 = [
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

const cpl_er2 = [
  // "2020-03-02 15:49:11	2020-03-02 20:17:51",
  // "2020-02-27 08:17:50	2020-02-27 14:22:55",
  // "2020-02-25 20:29:21	2020-02-26 03:11:20",
  // "2020-02-23 16:55:15	2020-02-23 18:05:45",
  // "2020-02-07 13:29:06	2020-02-07 18:01:08",
  // "2020-02-05 19:23:20	2020-02-06 00:49:20",
  // "2020-02-01 11:33:15	2020-02-01 15:55:03",
  // "2020-01-25 18:53:12	2020-01-25 23:28:08",
  // "2020-01-18 17:40:33	2020-01-18 20:18:54",
  // "2020-01-15 17:55:40	2020-01-15 21:33:13",
]

const hiwrap_er2 = [
  // "2020-02-27 07:43:38	2020-02-27 14:22:38",
  "2020-02-25 20:29:29	2020-02-26 03:01:12",
  "2020-02-07 12:22:21	2020-02-07 18:00:45",
  "2020-02-05 19:23:21	2020-02-06 00:48:35",
  "2020-02-01 11:33:16	2020-02-01 15:52:57",
  "2020-01-25 18:19:52	2020-01-26 00:30:40",
]

const flight_er2 = [
  // "2020-03-02 15:24:04	2020-03-02 20:48:31",
  // "2020-02-27 07:21:29	2020-02-27 15:17:57",
  // "2020-02-25 20:06:39	2020-02-26 03:57:48",
  // "2020-02-23 16:31:39	2020-02-23 19:05:32",
  "2020-02-07 12:04:21	2020-02-07 18:52:35 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-02-07/er2/FCX_IMPACTS_MetNav_ER2_20200207_R0.czml",
  "2020-02-05 18:59:12	2020-02-06 01:35:42 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-02-05/er2/FCX_IMPACTS_MetNav_ER2_20200205_R0.czml",
  "2020-02-01 11:09:00	2020-02-01 17:09:20 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-02-01/er2/FCX_IMPACTS_MetNav_ER2_20200201_R0.czml",
  "2020-01-25 17:49:01	2020-01-26 01:25:55 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-01-25/er2/FCX_IMPACTS_MetNav_ER2_20200125_R0.czml",
  "2020-01-18 17:14:58	2020-01-18 21:07:18 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-01-18/er2/FCX_IMPACTS_MetNav_ER2_20200118_R0.czml",
  // "2020-01-15 17:29:01	2020-01-15 22:37:00",
]

const flight_p3b = [
  "2020-02-25 20:57:55	2020-02-26 04:12:30",
  // "2020-02-24 17:50:45	2020-02-24 19:28:40",
  "2020-02-20 19:39:12	2020-02-21 01:12:20",
  "2020-02-18 17:21:44	2020-02-18 22:15:19",
  "2020-02-13 06:11:50	2020-02-13 12:41:30",
  "2020-02-07 14:05:47	2020-02-07 20:01:45",
  "2020-02-05 18:30:11	2020-02-06 01:40:15",
  "2020-02-01 11:30:54	2020-02-01 15:39:55",
  "2020-01-25 18:52:44	2020-01-26 00:29:02 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-01-25/p3/IMPACTS_MetNav_P3B_20200125_R1",
  "2020-01-18 18:01:07	2020-01-19 00:04:45 https://ghrc-fcx-viz-output.s3.us-west-2.amazonaws.com/fieldcampaign/impacts/2020-01-18/p3/IMPACTS_MetNav_P3B_20200118_R1",
  // "2020-01-12 18:25:28	2020-01-12 22:06:16",
]

const exrad_er2 = [
  "2020-01-25 18:19:57 2020-01-26 00:52:01",
  "2020-02-01 11:33:18 2020-02-01 16:06:56",
  "2020-02-05 19:23:26 2020-02-06 01:07:58",
  "2020-02-07 12:22:26 2020-02-07 18:15:41",
  "2020-02-25 20:29:39 2020-02-26 03:30:09",
  "2020-02-27 07:45:12 2020-02-27 14:50:09",
]

const defaultCamera = {
  "2020-02-27": {
    "position": {
      "x": 1282450.1951236466,
      "y": -4612390.68562685,
      "z": 4243465.903384102
    },
    "direction": {
      "x": -0.15189007465609003,
      "y": 0.8506759265307524,
      "z": 0.5032691856670877
    },
    "up": {
      "x": 0.16200972395675597,
      "y": -0.4808628732581122,
      "z": 0.8616981759673212
    },
    "right": {
      "x": 0.9750293608730064,
      "y": 0.21241790212455927,
      "z": -0.0647794743153882
    },
    "currentTime": {
      "dayNumber": 2458907,
      "secondsOfDay": 819.5622455056291
    }
  },
  "2020-02-25": {
    "position": {
      "x": 167336.41780971547,
      "y": -4930625.231399887,
      "z": 4115044.238574339
    },
    "direction": {
      "x": 0.5110370471923669,
      "y": 0.8401815963954201,
      "z": 0.18148284071875842
    },
    "up": {
      "x": 0.32180670435143044,
      "y": -0.38279172923382704,
      "z": 0.8659739817480937
    },
    "right": {
      "x": 0.7970455328470124,
      "y": -0.3841423917099231,
      "z": -0.46599682559004874
    },
    "currentTime": {
      "dayNumber": 2458905,
      "secondsOfDay": 42750.0225846027
    }
  },
  "2020-02-20": {
    "position": {
      "x": 1152175.4014700353,
      "y": -5291879.437954635,
      "z": 3463602.3848359007
    },
    "direction": {
      "x": -0.3107680364042867,
      "y": 0.7455123271069668,
      "z": 0.5896054593378347
    },
    "up": {
      "x": 0.07540913614565864,
      "y": -0.5990262103842223,
      "z": 0.797170660184181
    },
    "right": {
      "x": 0.9474896779042976,
      "y": 0.29219679909997714,
      "z": 0.12993975858272983
    },
    "currentTime": {
      "dayNumber": 2458900,
      "secondsOfDay": 33333
    }
  },
  "2020-02-18": {
    "position": {
      "x": 1466725.67562639,
      "y": -4762693.46682696,
      "z": 4203718.002419206
    },
    "direction": {
      "x": -0.3063943429158708,
      "y": 0.9158328183602021,
      "z": 0.259562623356216
    },
    "up": {
      "x": 0.044533564212428524,
      "y": -0.25858749491773597,
      "z": 0.9649607604098249
    },
    "right": {
      "x": 0.9508623813610935,
      "y": 0.30721776687974783,
      "z": 0.038444445967287355
    },
    "currentTime": {
      "dayNumber": 2458898,
      "secondsOfDay": 22502.11191614812
    }
  },
  "2020-02-13": {
    "position": {
      "x": 1414598.2984580104,
      "y": -4647274.09713824,
      "z": 4147921.185488084
    },
    "direction": {
      "x": -0.33283273267702423,
      "y": 0.8995929703197058,
      "z": 0.2827629038790514
    },
    "up": {
      "x": 0.03170251875086527,
      "y": -0.28901490489738185,
      "z": 0.9567995270964595
    },
    "right": {
      "x": 0.9424528223543053,
      "y": 0.32741849748987384,
      "z": 0.0676742575716788
    },
    "currentTime": {
      "dayNumber": 2458892,
      "secondsOfDay": 80010.35284018972
    }
  },
  "2020-02-07": {
    "position": {
      "x": 1167837.924975888,
      "y": -4640149.233339111,
      "z": 4311966.469695887
    },
    "direction": {
      "x": -0.19627190494224311,
      "y": 0.968790760699438,
      "z": 0.1513994759361709
    },
    "up": {
      "x": 0.07307393254096256,
      "y": -0.13952187620665174,
      "z": 0.9875190359900788
    },
    "right": {
      "x": 0.9778228570213227,
      "y": 0.20488559745179713,
      "z": -0.04340912626946318
    },
    "currentTime": {
      "dayNumber": 2458887,
      "secondsOfDay": 13700.385507125466
    }
  },
  "2020-02-05": {
    "position": {
      "x": 322477.3580603639,
      "y": -5070948.566990796,
      "z": 4017658.9103072267
    },
    "direction": {
      "x": -0.050732288914544246,
      "y": 0.9493185871396093,
      "z": 0.31019422137226743
    },
    "up": {
      "x": 0.00856173454007069,
      "y": -0.3101693571391732,
      "z": 0.9506427649719623
    },
    "right": {
      "x": 0.9986755887489975,
      "y": 0.05088408398633206,
      "z": 0.0076077877017786955
    },
    "currentTime": {
      "dayNumber": 2458885,
      "secondsOfDay": 40985.26789771022
    }
  },
  "2020-02-01": {
    "position": {
      "x": 1409133.8506857648,
      "y": -5022818.528261955,
      "z": 3707038.1788298516
    },
    "direction": {
      "x": -0.7318305100044828,
      "y": 0.3383816674500962,
      "z": -0.5915420118303274
    },
    "up": {
      "x": -0.5309273779586722,
      "y": -0.8272880560218273,
      "z": 0.183604443567021
    },
    "right": {
      "x": -0.42724726325689655,
      "y": 0.44843318286821576,
      "z": 0.7850907314076339
    },
    "currentTime": {
      "dayNumber": 2458881,
      "secondsOfDay": 6686.964750530418
    }
  },
  "2020-01-25": {
    "position": {
      "x": 1417615.8401272187,
      "y": -4587634.300189574,
      "z": 4251493.864725087
    },
    "direction": {
      "x": -0.368517239730467,
      "y": 0.8653350657736847,
      "z": 0.3396914305128853
    },
    "up": {
      "x": 0.036386370870621715,
      "y": -0.35170184178755076,
      "z": 0.9354046431882356
    },
    "right": {
      "x": 0.9289085401891314,
      "y": 0.35707287551100486,
      "z": 0.09812178931307448
    },
    "currentTime": {
      "dayNumber": 2458874,
      "secondsOfDay": 32505.864251786996
    }
  },
  "2020-01-18": {
    "position": {
      "x": 1369023.1347603223,
      "y": -4734867.366658855,
      "z": 4173267.8045715815
    },
    "direction": {
      "x": -0.276066461135645,
      "y": 0.9016817426573616,
      "z": 0.3328022595993378
    },
    "up": {
      "x": 0.08423159332575929,
      "y": -0.32222903775115064,
      "z": 0.9429069338570862
    },
    "right": {
      "x": 0.9574405191560703,
      "y": 0.28833744499865266,
      "z": 0.013006540270327493
    },
    "currentTime": {
      "dayNumber": 2458867,
      "secondsOfDay": 24886.08086882165
    }
  }
}

const legends = {
  crs: {
    url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`,
    color: "magenta"
  },
  cpl: {
    url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/crs_legend.png`,
    color: "magenta"
  },
  lip: {
    url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/lip_legend.png`,
    color: "red"
  },
  track: {
    url: `${dataBaseUrl}/fieldcampaign/goesrplt/legend/flighttrack_legend.png`,
    color: "darkgreen"
  },
  // 'hiwrap-Ku': {},
  // 'hiwrap-Ka': {},
}

const links = [
  {
    url: "https://ghrc.nsstc.nasa.gov/uso/ds_details/collections/impactsC.html",
    title: "Landing Page"
  }, {
    url: "https://ghrc.nsstc.nasa.gov/home/micro-articles/investigation-microphysics-and-precipitation-atlantic-coast-threatening-snowstorms",
    title: "Micro Article"
  }, {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/impacts",
    title: "Description"
  }, {
    url: "https://ghrc.nsstc.nasa.gov/home/field-campaigns/impacts/instruments",
    title: "Instruments"
  },
]

const dois = [
  {
    shortName: "impactscrs",
    longName: "IMPACTS Cloud Radar System (CRS)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/CRS/DATA101"
  }, {
    shortName: "impactscpl",
    longName: "IMPACTS Cloud Physics LiDAR (CPL)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/CPL/DATA101"
  }, {
    shortName: "impactslip",
    longName: "IMPACTS Lightning Instrument Package (LIP)",
    doi: "http://dx.doi.org/10.5067/IMPACTS/LIP/DATA101"
  },
]

const campaign = "IMPACTS"
const description = "IMPACTS will fly a complementary suite of remote sensing and in-situ instruments for three 6-week deployments (2020-2022) on NASA’s ER-2 high-altitude aircraft and P-3 cloud-sampling aircraft."


export {
  cpl_er2,
  crs_er2,
  exrad_er2,
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
