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
          return startDateTimePoints(layerObject);
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

}

function startDateTimePoints(layer){

}
