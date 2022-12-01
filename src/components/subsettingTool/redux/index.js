// ACTION_TYPE DEFINATOPMS
export const Resources = {
  triggerSubsettingTool: {
    url: "/default/sanjog-subsetting-fcx-trigger",
    body: {},
    syncActions: {},
    asyncActions: {
      init: 'subsetting_INIT',
      success: 'subsetting_SUCCESS',
      error: 'subsetting_ERROR',
    },
  }
};

// Initial State Reference for reducers
const initialState = {
  subsettingStarted: false,
  subsetsDir: []
};

// Reducer
export function onTriggeredSubsettingTool(state = initialState, action = {}) {
  const {init, success, error} = Resources.triggerSubsettingTool.asyncActions;

  switch (action.type) {
    case init: {
      return {
        ...state,
        subsettingStarted: false,
      };
    }

    case success: {
      const newSubsetDir = action.payload.subsetDir
      return {
        ...state,
        subsettingStarted: true,
        subsetsDir: [...state.subsetsDir, newSubsetDir]
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

// map state to props
export const mapStateToProps = state => {
  const {
    onTriggeredSubsettingTool: {subsettingStarted, subsetsDir},
  } = state;
  return {subsettingStarted, subsetsDir};
};

// action dispatchers
