import {JulianDate} from "cesium";

export function extractLayerStartDatetime(layerObject){
  /**
   * For a active layer, returns the start date time of that layer.
   * Also applies special cases.
   * @param {Object} layerObject a layer that is loaded and active.
   * @returns {String} a string representation of datetime of that layer.
   */
  const {layer} = layerObject;

  /** Special cases start */
  if (layer.fieldCampaignName === "GOES-R PLT" && layer.date === "2017-05-17") {
    // The main GOES-R campaign, which visualizes all the instrument initially.
    return "2017-05-17T05:45:40Z"
  }
  if (layer.start) {
    // when start time of the instrument is coded in the layer info. (say, GOES-R, IMPACTS)
    // Highest Prioritiy to the hardcoded inline layer style.
    return layer.start
  }
  /** Special cases end */

  switch (layer.displayMechanism) {
      case '3dtile':
          // get the start time of the 3d tile
          return startDateTime3dtile(layerObject);
      case 'czml':
          // get the start time of the czml
          return startDateTimeCZML(layerObject);
      case 'points':
          // get the start time of the points
            // return startDateTimePoints(layerObject);
            return undefined;
      case 'entities':
          // no time, return undefined, handle it in the caller
          return undefined;
      case 'wmts':
          // no time, return undefined, handle it in the caller
          return undefined;
      default:
          // no time, return undefined, handle it in the caller
          return undefined;
  }
}

// helpers:

function startDateTime3dtile(layerObject){
  const {cesiumLayerRef: tileset} = layerObject;
  return tileset.properties.epoch;
}

function startDateTimeCZML(layer){
    const {cesiumLayerRef: dataSource} = layer;
    let clock = dataSource.clock.getValue();
    let julianStartTime = clock.startTime;
    let isoStartTime = JulianDate.toIso8601(julianStartTime);
    return isoStartTime;
}