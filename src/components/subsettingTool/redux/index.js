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
  subsettingStarted: false
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
      return {...state, subsettingStarted: true};
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
    onTriggeredSubsettingTool: {subsettingStarted},
  } = state;
  return {subsettingStarted};
};

// action dispatchers
