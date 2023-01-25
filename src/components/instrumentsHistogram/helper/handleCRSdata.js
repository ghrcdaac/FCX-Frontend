import APICaller from "./apiCaller.js";

export default async function fetchCRSData(datetime="2017-05-17", params="1011.825", pagesize="200", pageno="1", density="1") {
/** 
* LIP data handler
* @summary Takes the necessary common data from the input fields and fills some of the instrument specific fields, needed for the FEGS data fetch.
* @param {string} datetime - The date time of the data collected by FEGS instrument
* @param {number} pagesize- The data elements per page.
* @param {number} pageno - The page from which data is to be fetched.
* @param {number} density - The amount of data that is sampled out of the page. 100%, 50% or 25%
* @return {object} with keys data and labels
*/
    let coordType = "time";
    let dataType = "ref";

    const apiCaller = new APICaller();
    apiCaller.setHeader('tUS7oors8qawUhT7c8QBn5OXLzH7TPgs6pmiuK2t');

    let url = "https://kz1ey7qvul.execute-api.us-east-1.amazonaws.com/default/sanjog-histogram-preprocessing-fcx-v1";
    let body = {
                "data": {
                    "type": "data_pre_process_request",
                    "attributes": {
                            "instrument_type" : "CRS",
                            "datetime" : datetime,
                            "coord_type" : coordType,
                            "data_type" : dataType,
                            "params" : params,
                            "pageno" : String(pageno),
                            "pagesize" : String(pagesize),
                            "density": String(density),
                        }
                    }
                }
            
    let rawData = await apiCaller.post(url, body);
    let preprocessedData = JSON.parse(rawData["data"]["data"]["attributes"]["data"])
    let data = {
        labels: preprocessedData["index"],
        datasets: [
          {
            label: preprocessedData["columns"][0],
            data: preprocessedData["data"],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }
        ],
      };
    let labels = {
        xaxis: coordType,
        yaxis: dataType
    }

    return {
        data, labels
    }
}