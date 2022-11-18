import APICall from "./ApiCall";
import { subsettingApiKey } from "../config";
import { toast } from 'react-toastify';

const apiCaller = new APICall();
apiCaller.setHeader(subsettingApiKey);

export const Get = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  return (dispatch, getState) => {
    dispatch(initDispatchAction(init, undefined));
    apiCaller.get(Resources.url)
      .then(data => {
        handleSuccess(data.status, data.body);
        dispatch(successDispatchAction(success, data));
      })
      .catch(err => {
        handleError(err.status, "Something went wrong. Call Support.");
        dispatch(errorDispatchAction(error, err));
      });
  };
};

export const Post = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  return (dispatch, getState) => {
    dispatch(initDispatchAction(init, undefined));
    apiCaller.post(Resources.url, Resources.body)
      .then(data => {
        handleSuccess(data.status, data.body);
        dispatch(successDispatchAction(success, data));
      })
      .catch(err => {
        handleError(400, "Something went wrong. Call Support.");
        dispatch(errorDispatchAction(error, err));
      });
  };
};

// @utils

const initDispatchAction = (type, payload) => ({type, payload});
const successDispatchAction = (type, payload) => ({type, payload});
const errorDispatchAction = (type, payload) => ({type, payload});

const handleSuccess = (status, body) => {
  if (200 <= status < 300) {
    toast.success('Subsetting invoke successful. It will take some time to finish subsetting.', {
      position: "bottom-left",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      });
  }
  //TODO: add cases for 400, 500, 300, 100 status codes.
}

const handleError = (status, body) => {
  toast.error(body, {
    position: "bottom-left",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    });
}