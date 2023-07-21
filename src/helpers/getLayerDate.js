import {JulianDate} from "cesium";

export function getStartDateTimeBasedOffDisplayMechanism(layerObject){
  const {layer} = layerObject;
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

function startDateTimePoints(layer){

}