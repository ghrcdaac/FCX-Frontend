import APICall from "./ApiCall";

const apiCaller = new APICall();
apiCaller.setHeader(process.env.SUBSETTING_API_KEY);

export const Get = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  return async (dispatch, getState) => {
    dispatch(handleInit(init, undefined));
    apiCaller.Get(Resources.url)
      .then(data => {
        dispatch(handleSuccess(success, data));
      })
      .catch(err => {
        dispatch(handleError(error, err));
      });
  };
};

export const Post = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  return async (dispatch, getState) => {
    dispatch(handleInit(init, undefined));
    apiCaller.Post(Resources.url, Resources.body)
      .then(data => {
        dispatch(handleSuccess(success, data));
      })
      .catch(err => {
        dispatch(handleError(error, err));
      });
  };
};

// @utils

const handleInit = (type, payload) => ({type, payload});
const handleSuccess = (type, payload) => ({type, payload});
const handleError = (type, payload) => ({type, payload});