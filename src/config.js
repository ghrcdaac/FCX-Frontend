/*
    Following are the settings for FCX that should be configured per deployment environment.
    
    TODO:
    Don't freak out, the default value are left here only to make it easy to get started working with the code base. They are not guaranteed to work.
    In future, actual values of these variables should be directly read from environment variables and defaults should be removed.
*/

const dataBaseUrl = process.env.DATA_BASE_URL || "https://ghrc-fcx-viz-output.s3-us-west-2.amazonaws.com"
const abiBaseUrl = process.env.ABI_BASE_URL || "https://q6eymnfsd9.execute-api.us-west-2.amazonaws.com"
const flightTrackBaseUrl = process.env.FLIGHT_TRACK_BASE_URL || "https://fcx-czml.s3.amazonaws.com"
const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiYWppbmt5YWt1bGthcm5pIiwiYSI6ImNrYzY1NHh3bDA3cXIyenA4dDdpOGlja2UifQ.g4r3pjugLK8yC2mkQmJr4w"
const mapboxStyleId = process.env.MAPBOX_STYLE || "ckc65ettm0ixc1ipexrpklr96"
const mapboxUsername = process.env.MAPBOX_USERNAME || "ajinkyakulkarni"
const mapboxUrl = "https://api.mapbox.com/styles/v1/" + mapboxUsername + "/" + mapboxStyleId + "/tiles/256/{z}/{x}/{y}?access_token=" + mapboxAccessToken
const cesiumDefaultAccessToken =
  process.env.CESIUM_DEFAULT_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNmQyZDgxNS0xNzY4LTQ4MzctOWZkOC02YmZkYjQ1ZGI1MDUiLCJpZCI6ODU1MSwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU5NDM4OTIxMn0.WPkQXxpVgW5AfQdZKB15dMnLxQIjmA_Q2qimnDXONvc"
const supportEmail = process.env.GHRC_SUPPORT_EMAIL || "support-ghrc@earthdata.nasa.gov"

export { dataBaseUrl, abiBaseUrl, flightTrackBaseUrl, mapboxUrl, cesiumDefaultAccessToken, supportEmail }
