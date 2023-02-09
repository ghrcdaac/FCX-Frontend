/*
    Following are the settings for FCX that should be configured per deployment environment.
    
*/
import dotenv from 'dotenv'
dotenv.config()

const dataBaseUrl = process.env.REACT_APP_BAMBOO_DATA_BASE_URL 

const abiBaseUrl = process.env.REACT_APP_BAMBOO_ABI_BASE_URL 
const flightTrackBaseUrl = process.env.REACT_APP_BAMBOO_FLIGHT_TRACK_BASE_URL 
const newFieldCampaignsBaseUrl = process.env.REACT_APP_NEW_FIELD_CAMPAIGNS_BASE_URL

const mapboxAccessToken = process.env.REACT_APP_BAMBOO_MAPBOX_ACCESS_TOKEN 
const mapboxStyleId = process.env.REACT_APP_BAMBOO_MAPBOX_STYLE 
const mapboxUsername = process.env.REACT_APP_BAMBOO_MAPBOX_USERNAME 
const mapboxUrl = "https://api.mapbox.com/styles/v1/" + mapboxUsername + "/" + mapboxStyleId + "/tiles/256/{z}/{x}/{y}?access_token=" + mapboxAccessToken
const cesiumDefaultAccessToken = process.env.REACT_APP_BAMBOO_CESIUM_DEFAULT_TOKEN 
const supportEmail = process.env.REACT_APP_BAMBOO_GHRC_SUPPORT_EMAIL || "support-ghrc@earthdata.nasa.gov"

export { dataBaseUrl, abiBaseUrl, flightTrackBaseUrl, mapboxUrl, cesiumDefaultAccessToken, supportEmail, newFieldCampaignsBaseUrl }

/*
  dataBaseUrl -  (S3) URL root address where the data resides
  abiBaseUrl -  (API) URL for the terracota mapping server (deployed using FCX core)
  flightTrackBaseUrl -  (S3) URL root address where the Flight data resides
  mapboxAccessToken - Map box Access token. Generate from Map box website
  mapboxStyleId - Generate from Map box website
  mapboxUsername - Generate from Map box website
  cesiumDefaultAccessToken - Create an access Token from CesiumJS website.
*/