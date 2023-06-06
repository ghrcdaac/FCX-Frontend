import APICall from "../../../constants/ApiCall";
// api key
// import { toast } from 'react-toastify';

import { dataExtractorFEGS } from "../helper/handleFEGSdata";
import { dataExtractorLIP } from "../helper/handleLIPdata";

const apiCaller = new APICall();
let HistogramApiKey = "TOl3gUuA7n80coKZAqsAP1b2rZx9SWSb6AQwxaBk"
apiCaller.setHeader(HistogramApiKey);

/**
 * API POST CALL, in the "redux-thunk" way.
 * The dispatch is done automatically, when Post call is resolved.
 * i.e. as per the Async actions mentioned in the resource.
 *
 * Usage:
 * Use these functions as a map_reducer_to_props in redux connect first,
 * Then, simply use these functions in the component (accessible though props).
 * */

export const Post = Resources => {
  const {init, success, error} = Resources.asyncActions; // as actions for all the resource is same
  const {instrument_type} = Resources.body.data.attributes; 
  return async (dispatch, getState) => {
    // dispatch initial action
    dispatch(initDispatchAction(init, undefined));
    return apiCaller.post(Resources.url, Resources.body)
      .then(res => {
        let extractedData = {};
        // now preprocess according to type of instrument and then dispatch the success action
        switch(instrument_type) {
            case "FEGS":
                extractedData = dataExtractorFEGS(res);
            break;
            case "LIP":
                extractedData = dataExtractorLIP(res);
            break;
            default:
                extractedData = dataExtractorFEGS(res);
            break;
        }
        // handleSuccess(res.status);
        // dispatch success action
        dispatch(successDispatchAction(success, extractedData));
        return extractedData;
      })
      .catch(err => {
        // handleError(400, "Something went wrong. Call Support.");
        // dispatch error action
        dispatch(errorDispatchAction(error, err));
        return err;
      });
  };
};

// @utils

const initDispatchAction = (type, payload) => ({type, payload});
const successDispatchAction = (type, payload) => ({type, payload});
const errorDispatchAction = (type, payload) => ({type, payload});

// const handleSuccess = (status) => {
//   if (200 <= status < 300) {
//     toast.success('Fetching data for Histogram.', {
//       position: "bottom-left",
//       autoClose: 5000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       progress: undefined,
//       theme: "colored",
//       });
//   }
//   //TODO: add cases for 400, 500, 300, 100 status codes.
// }

// const handleError = (status, body) => {
//   toast.error(body, {
//     position: "bottom-left",
//     autoClose: 5000,
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     progress: undefined,
//     theme: "colored",
//     });
// }
