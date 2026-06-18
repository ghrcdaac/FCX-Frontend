/*
    Following are the settings for FCX that should be configured per deployment environment.
    
*/
import dotenv from 'dotenv'
dotenv.config()

const dataBaseUrl = process.env.REACT_APP_BAMBOO_DATA_BASE_URL 

const abiBaseUrl = process.env.REACT_APP_BAMBOO_ABI_BASE_URL 
const flightTrackBaseUrl = process.env.REACT_APP_BAMBOO_FLIGHT_TRACK_BASE_URL 
const newFieldCampaignsBaseUrl = process.env.REACT_APP_NEW_FIELD_CAMPAIGNS_BASE_URL

function leeInstrumentBaseUrl(folder) {
  if (process.env.REACT_APP_LEE_INSTRUMENT_BASE_URL) {
    return `${process.env.REACT_APP_LEE_INSTRUMENT_BASE_URL}/${folder}`
  }
  if (newFieldCampaignsBaseUrl) {
    return `${newFieldCampaignsBaseUrl}/Lee/instrument-processed-data/${folder}`
  }
  if (dataBaseUrl) {
    return `${dataBaseUrl}/fieldcampaign/Lee/instrument-processed-data/${folder}`
  }
  return ""
}

const leeDow7BaseUrl =
  process.env.REACT_APP_LEE_DOW7_BASE_URL || leeInstrumentBaseUrl("Mobile_radar")
const leeLmaBaseUrl = leeInstrumentBaseUrl("Combined_LMA")
const leeOswegoSoundingBaseUrl = leeInstrumentBaseUrl("Oswego_soundings")
const leeNsslSoundingBaseUrl = leeInstrumentBaseUrl("NSSL_Mobile_Sounding")
const leeNov18Folder = "Nov18"
const leeNov19Folder = "Nov19"
const leeGlmPointsFile = "lee_points.json"

function leeProcessedDataBaseUrl() {
  if (process.env.REACT_APP_LEE_INSTRUMENT_BASE_URL) {
    return process.env.REACT_APP_LEE_INSTRUMENT_BASE_URL.replace(/\/$/, "")
  }
  if (newFieldCampaignsBaseUrl) {
    return `${newFieldCampaignsBaseUrl.replace(/\/$/, "")}/Lee/instrument-processed-data`
  }
  if (dataBaseUrl) {
    return `${dataBaseUrl}/fieldcampaign/Lee/instrument-processed-data`
  }
  return ""
}

/** Shared IOP folder at processed-data root, e.g. Nov18/lee_points.json */
function leeIopOutputPath(iopFolder, ...segments) {
  const base = leeProcessedDataBaseUrl()
  if (!base || !iopFolder) return ""
  return [base, iopFolder, ...segments].filter(Boolean).join("/")
}

function leeInstrumentIopPath(instrumentFolder, iopFolder, ...segments) {
  const base = leeInstrumentBaseUrl(instrumentFolder)
  if (!base || !iopFolder) return ""
  const parts = [base.replace(/\/$/, ""), iopFolder, ...segments].filter(Boolean)
  return parts.join("/")
}

function leeInstrumentNov19Path(instrumentFolder, ...segments) {
  return leeInstrumentIopPath(instrumentFolder, leeNov19Folder, ...segments)
}

function leeGlmLeePointsPath(iopFolder) {
  return leeInstrumentIopPath("GLM", iopFolder, leeGlmPointsFile)
}

function leeNsslSoundingCzmlPath(iopFolder, fileName) {
  return leeInstrumentIopPath("NSSL_Mobile_Sounding", iopFolder, fileName)
}

function leeOswegoSoundingCzmlPath(iopFolder, fileName = "oswego_animated.czml") {
  return leeInstrumentIopPath("Oswego_soundings", iopFolder, fileName)
}

function leeCombinedLmaTilesetPath(iopFolder) {
  return leeInstrumentIopPath("Combined_LMA", iopFolder, "lee_tileset", "tileset.json")
}

function leeEfmCzmlPath(iopFolder, modeFolder, fileName) {
  return leeInstrumentIopPath("Balloon_electric_field_meter", iopFolder, modeFolder, fileName)
}

function leeNexradFramesPath(iopFolder) {
  return leeInstrumentIopPath("NEXRAD", iopFolder, "frames.json")
}

function leeMobileRadarTilesetPath(iopFolder, level) {
  if (process.env.REACT_APP_LEE_DOW7_BASE_URL) {
    const base = process.env.REACT_APP_LEE_DOW7_BASE_URL.replace(/\/$/, "")
    return `${base}/${iopFolder}/${level}/tileset.json`
  }
  return leeInstrumentIopPath("Mobile_radar", iopFolder, level, "tileset.json")
}

function leeMobileRadarSurfaceCzmlPath(iopFolder) {
  if (process.env.REACT_APP_LEE_DOW7_BASE_URL) {
    const base = process.env.REACT_APP_LEE_DOW7_BASE_URL.replace(/\/$/, "")
    return `${base}/${iopFolder}/dow7_surface_obs.czml`
  }
  return leeInstrumentIopPath("Mobile_radar", iopFolder, "dow7_surface_obs.czml")
}

function buildLeeEfmBaseUrls() {
  if (process.env.REACT_APP_LEE_EFM_BASE_URL) {
    return [process.env.REACT_APP_LEE_EFM_BASE_URL]
  }

  const urls = []

  if (newFieldCampaignsBaseUrl) {
    const base = newFieldCampaignsBaseUrl.replace(/\/$/, "")
    urls.push(`${base}/Lee/instrument-processed-data/Balloon_electric_field_meter`)
  }

  if (dataBaseUrl) {
    urls.push(
      `${dataBaseUrl}/fieldcampaign/Lee/instrument-processed-data/Balloon_electric_field_meter`
    )
  }

  return urls
}

const leeEfmBaseUrls = buildLeeEfmBaseUrls()
const leeEfmBaseUrl = leeEfmBaseUrls[0] || leeInstrumentBaseUrl("Balloon_electric_field_meter")

function buildLeeNexradFramesUrls() {
  if (process.env.REACT_APP_LEE_NEXRAD_FRAMES_URL) {
    return [process.env.REACT_APP_LEE_NEXRAD_FRAMES_URL]
  }

  const urls = []
  const nexradBase = leeInstrumentBaseUrl("NEXRAD")

  if (nexradBase) {
    urls.push(`${nexradBase}/radar_frames_mode/frames.json`)
    urls.push(`${nexradBase}/radar_tiles/frames.json`)
  }

  if (newFieldCampaignsBaseUrl) {
    const base = newFieldCampaignsBaseUrl.replace(/\/$/, "")
    urls.push(`${base}/Lee/instrument-processed-data/NEXRAD/radar_frames_mode/frames.json`)
    urls.push(`${base}/Lee/instrument-processed-data/NEXRAD/radar_tiles/frames.json`)
    urls.push(`${base}/LEE/NEXRAD/radar_frames_mode/frames.json`)
    urls.push(`${base}/LEE/NEXRAD/radar_tiles/frames.json`)
  }

  return urls
}

const leeNexradFramesUrls = buildLeeNexradFramesUrls()
const leeNexradFramesUrl = leeNexradFramesUrls[0] || ""

function buildLeeGlmPointsUrls() {
  const urls = []

  if (process.env.REACT_APP_LEE_GLM_NOV18_POINTS_URL) {
    urls.push(process.env.REACT_APP_LEE_GLM_NOV18_POINTS_URL)
  }
  if (process.env.REACT_APP_LEE_GLM_NOV19_POINTS_URL) {
    urls.push(process.env.REACT_APP_LEE_GLM_NOV19_POINTS_URL)
  }
  if (process.env.REACT_APP_LEE_GLM_POINTS_URL) {
    urls.push(process.env.REACT_APP_LEE_GLM_POINTS_URL)
  }

  const defaults = [leeGlmLeePointsPath(leeNov18Folder), leeGlmLeePointsPath(leeNov19Folder)].filter(
    Boolean
  )

  return [...new Set([...urls, ...defaults])]
}

const leeGlmPointsUrls = buildLeeGlmPointsUrls()
const leeGlmPointsUrl = leeGlmPointsUrls[0] || ""

const mapboxAccessToken = process.env.REACT_APP_BAMBOO_MAPBOX_ACCESS_TOKEN 
const mapboxStyleId = process.env.REACT_APP_BAMBOO_MAPBOX_STYLE 
const mapboxUsername = process.env.REACT_APP_BAMBOO_MAPBOX_USERNAME 
const mapboxUrl = "https://api.mapbox.com/styles/v1/" + mapboxUsername + "/" + mapboxStyleId + "/tiles/256/{z}/{x}/{y}?access_token=" + mapboxAccessToken
const cesiumDefaultAccessToken = process.env.REACT_APP_BAMBOO_CESIUM_DEFAULT_TOKEN 
const supportEmail = process.env.REACT_APP_BAMBOO_GHRC_SUPPORT_EMAIL || "support-ghrc@earthdata.nasa.gov"

// SUBSETTING TOOL ENVS
const subsettingEndpoint = process.env.REACT_APP_SUBSET_TRIGGER_API
const subsettingApiKey = process.env.REACT_APP_SUBSETTING_TOOL_API_KEY
const outputSubsetsBucket = process.env.REACT_APP_SUBSET_OUTPUT_BUCKET
const outputSubsetsBucketRegion = process.env.REACT_APP_SUBSET_OUTPUT_BUCKET_REGION
const subsetCloudfrontUrl = process.env.REACT_APP_SUBSET_CLOUDFRONT_URL
const subsetFilenamesListEndpoint = process.env.REACT_APP_SUBSET_FILENAMES_LIST_API
const WSEndpoint = process.env.REACT_APP_WS_ENDPOINT

// HISTOGRAM TOOL ENVS
const histogramToolApiUrl = process.env.REACT_APP_HISTOGRAM_TOOL_API
const histogramToolApikey = process.env.REACT_APP_HISTOGRAM_TOOL_API_KEY

export { dataBaseUrl, abiBaseUrl, flightTrackBaseUrl, mapboxUrl, cesiumDefaultAccessToken, supportEmail, newFieldCampaignsBaseUrl, leeDow7BaseUrl, leeLmaBaseUrl, leeOswegoSoundingBaseUrl, leeNsslSoundingBaseUrl, leeNov18Folder, leeNov19Folder, leeGlmPointsFile, leeProcessedDataBaseUrl, leeIopOutputPath, leeInstrumentIopPath, leeInstrumentNov19Path, leeGlmLeePointsPath, leeNsslSoundingCzmlPath, leeOswegoSoundingCzmlPath, leeCombinedLmaTilesetPath, leeEfmCzmlPath, leeNexradFramesPath, leeMobileRadarTilesetPath, leeMobileRadarSurfaceCzmlPath, leeEfmBaseUrl, leeEfmBaseUrls, leeNexradFramesUrl, leeNexradFramesUrls, leeGlmPointsUrl, leeGlmPointsUrls, leeInstrumentBaseUrl,
  subsettingEndpoint, subsettingApiKey, outputSubsetsBucket, outputSubsetsBucketRegion, subsetCloudfrontUrl, subsetFilenamesListEndpoint, WSEndpoint,
  histogramToolApiUrl, histogramToolApikey }

/*
  dataBaseUrl -  (S3) URL root address where the data resides
  abiBaseUrl -  (API) URL for the terracota mapping server (deployed using FCX core)
  flightTrackBaseUrl -  (S3) URL root address where the Flight data resides
  mapboxAccessToken - Map box Access token. Generate from Map box website
  mapboxStyleId - Generate from Map box website
  mapboxUsername - Generate from Map box website
  cesiumDefaultAccessToken - Create an access Token from CesiumJS website.

  subsettingEndpoint - Base Gateway API endpoint to trigger subsetting tool.
  subsettingApiKey - Key to invoke the subetting endpoint.
  outputSubsetsBucket - bucket to hold the subsets data.
  outputSubsetsBucketRegion- region of the output subsets bucket.
  subsetCloudfrontUrl- cloudfront url that opens get access to private subsets data.
  subsetFilenamesListEndpoint- API GATEWAY endpoint to get the list of available subset files.
  WSEndpoint - API GATEWAY to support websocket connection in serverless architecture.
*/