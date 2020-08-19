import { selectedLayers, layerStatus } from "./listReducer"
import { combineReducers } from "redux"

const rootReducer = combineReducers({
  selectedLayers,
  layerStatus,
})

export default rootReducer
