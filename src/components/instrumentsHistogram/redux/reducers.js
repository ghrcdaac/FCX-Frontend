// ACTION_TYPE DEFINATOPMS
export const Resources = {
    url: "https://6lnw7mfi9f.execute-api.us-east-1.amazonaws.com/development/fcx-histogram-preprocessing",
    body: {
      "data": {
          "type": "data_pre_process_request",
          "attributes": {
                  "instrument_type" : "CRS",
                  "datetime" : "2017-05-17",
                  "coord_type" : "time",
                  "data_type" : "ref",
                  "params" : "1011.8250122070312",
                  "pageno" : "1",
                  "pagesize" : "2000",
                  "density": "1"
              }
          }
      },
    syncActions: {},
    asyncActions: {
      init: 'histogram_tool_INIT',
      success: 'histogram_tool_SUCCESS',
      error: 'histogram_tool_ERROR',
    }
};

// Initial State Reference for reducers
const initialState = {
  data: [],
  labels: [],
  error: false
};

// Reducer
export function histogramTool(state = initialState, action = {}) {
  const {init, success, error} = Resources.asyncActions;

  switch (action.type) {
    case init: {
      return {
        ...state
      };
    }

    case success: {
      return {
        ...state,
        data: action.payload.data,
        labels: action.payload.labels,
        error: action.payload.error
      };
    }

    case error: {
      return {...state};
    }

    default: {
      return {...state};
    }
  }
}