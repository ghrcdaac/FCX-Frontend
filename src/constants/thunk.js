import APICall from "./ApiCall";
import { subsettingApiKey } from "../config";

const apiCaller = new APICall();
apiCaller.setHeader(subsettingApiKey);

export const Get = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  return (dispatch, getState) => {
    dispatch(handleInit(init, undefined));
    apiCaller.get(Resources.url)
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
  return (dispatch, getState) => {
    dispatch(handleInit(init, undefined));
    apiCaller.post(Resources.url, Resources.body)
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