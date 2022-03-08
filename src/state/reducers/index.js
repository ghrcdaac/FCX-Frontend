import { selectedLayers, layerStatus } from "./listReducer"
import { combineReducers } from "redux"
import { cloneDeep } from 'lodash'

const initialState = {
  selectedLayers: [],
  layerStatus:{
    inProgress: [],
    selectedLayers: [],
    loaded: []
  }
}

const appReducer = combineReducers({
  selectedLayers,
  layerStatus,
})

const rootReducer = (state, action) => {
  if (action.type === "RESET_STORE"){
    return cloneDeep(initialState)
  }
  
  return appReducer(state, action)

}

export default rootReducer
export { rootReducer, initialState }
