import APICaller from "./apiCaller.js";

export default async function fetchFEGSData(datetime="2017-03-21", pagesize="200", pageno="1", density="1") {
/** 
* FEGS data handler
* @summary Takes the necessary common data from the input fields and fills some of the instrument specific fields, needed for the FEGS data fetch.
* @param {string} datetime - The date time of the data collected by FEGS instrument
* @param {string} pagesize- The data elements per page.
* @param {string} pageno - The page from which data is to be fetched.
* @param {string} density - The amount of data that is sampled out of the page. 100%, 50% or 25%
* @return {object} with keys data and labels
*/
    let coordType = "FlashID";
    let dataType = "peak";
    let params = "None";

    const apiCaller = new APICaller();
    apiCaller.setHeader('tUS7oors8qawUhT7c8QBn5OXLzH7TPgs6pmiuK2t');

    let url = "https://kz1ey7qvul.execute-api.us-east-1.amazonaws.com/default/sanjog-histogram-preprocessing-fcx-v1";
    let body = {
                "data": {
                    "type": "data_pre_process_request",
                    "attributes": {
                            "instrument_type" : "FEGS",
                            "datetime" : datetime,
                            "coord_type" : coordType,
                            "data_type" : dataType,
                            "params" : params,
                            "pageno" : pageno,
                            "pagesize" : pagesize,
                            "density": density,
                        }
                    }
                }
            
    let rawData = await apiCaller.post(url, body);
    let preprocessedData = JSON.parse(rawData["data"]["data"]["attributes"]["data"])
    let data = {
        labels: preprocessedData["index"],
        datasets: [
          {
            label: 'Peak',
            data: preprocessedData["data"],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }
        ],
      };
    let labels = {
        xaxis: "FlashID",
        yaxis: preprocessedData["columns"][0]
    }

    return {
        data, labels
    }
}