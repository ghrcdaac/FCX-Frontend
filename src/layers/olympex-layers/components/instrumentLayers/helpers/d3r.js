import { newFieldCampaignsBaseUrl } from "../../../../../config"

export default { "ku": (date, index) => ({
                  layerId: `${date}-d3r-ku-${index}`,
                  fieldCampaignName: "Olympex",
                  shortName: "olympexd3rKu",
                  displayName: "Dual-frequency Dual-polarized Doppler Radar(D3R) Ku",
                  variableName: "ku Radar Reflectivity",
                  unit: "dBZ",
                  // czmlLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/nexrad/katx/olympex_Level2_${date.replace(/-/g,'')}.czml`,
                  czmlLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/d3r/20160115ku/knit.czml`,
                  date,
                  type: "tiles",
                  platform: "ground",
                  displayMechanism: "czml",
                }),
                "ka": (date, index) => ({
                  layerId: `${date}-d3r-ka-${index}`,
                  fieldCampaignName: "Olympex",
                  shortName: "olympexd3rKa",
                  displayName: "Dual-frequency Dual-polarized Doppler Radar(D3R) Ka",
                  variableName: "ka Radar Reflectivity",
                  unit: "dBZ",
                  czmlLocation: `${newFieldCampaignsBaseUrl}/Olympex/instrument-processed-data/d3r/20160115ka/knit.czml`,
                  date,
                  type: "tiles",
                  platform: "ground",
                  displayMechanism: "czml",
                })
              }