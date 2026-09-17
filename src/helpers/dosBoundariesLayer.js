import {
  WebMapServiceImageryProvider,
  GeographicTilingScheme,
} from "cesium"

/**
 * GIBS U.S. Department of State international boundaries (LSIB-based).
 *
 * Cesium WebMapServiceImageryProvider defaults to GeographicTilingScheme
 * (EPSG:4326). Must hit the GIBS epsg4326 WMS endpoint — NOT epsg3857 —
 * or GetMap requests use srs=EPSG:4326 against a mercator service and
 * return empty/wrong tiles (invisible overlay).
 *
 * Place-name renames (Lake America / Gulf of America) remain Mapbox Studio.
 */
const GIBS_DOS_LAYER = "DoS_International_Boundaries"

/**
 * @param {import("cesium").Viewer} viewer
 * @returns {import("cesium").ImageryLayer | null}
 */
export function addDosInternationalBoundariesOverlay(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return null

  try {
    const provider = new WebMapServiceImageryProvider({
      url: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",
      layers: GIBS_DOS_LAYER,
      parameters: {
        transparent: true,
        format: "image/png",
        styles: "",
        version: "1.1.1",
      },
      tilingScheme: new GeographicTilingScheme(),
      enablePickFeatures: false,
      credit: "© GIBS / U.S. Department of State (LSIB)",
    })

    const layer = viewer.imageryLayers.addImageryProvider(provider)
    // Tint toward dark green (GIBS bakes line color into PNGs; Cesium can only hue-shift)
    layer.alpha = 1.0
    layer.brightness = 0.65
    layer.contrast = 1.8
    layer.saturation = 2.5
    layer.hue = 2.1 // radians — rotate toward green
    layer.gamma = 0.9
    viewer.imageryLayers.raiseToTop(layer)
    console.info(
      "[FCX] Added GIBS DoS_International_Boundaries overlay (US-policy borders)"
    )
    return layer
  } catch (err) {
    console.warn(
      "Could not add GIBS DoS_International_Boundaries overlay:",
      err
    )
    return null
  }
}
