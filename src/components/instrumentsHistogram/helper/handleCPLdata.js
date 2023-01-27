import APICaller from "./apiCaller.js";

export async function fetchCPLData(datetime="2017-04-27", params="0", pagesize="200", pageno="1", density="1") {
/** 
* CPL data handler
* @summary Takes the necessary common data from the input fields and fills some of the instrument specific fields, needed for the CPL data fetch.
* @param {string} datetime - The date time of the data collected by CPL instrument
* @param {number} pagesize- The data elements per page.
* @param {number} pageno - The page from which data is to be fetched.
* @param {number} density - The amount of data that is sampled out of the page. 100%, 50% or 25%
* @return {object} with keys data and labels
*/
    let coordType = "Second";
    let dataType = "ATB_1064";

    const apiCaller = new APICaller();
    apiCaller.setHeader('tUS7oors8qawUhT7c8QBn5OXLzH7TPgs6pmiuK2t');

    let url = "https://kz1ey7qvul.execute-api.us-east-1.amazonaws.com/default/sanjog-histogram-preprocessing-fcx-v1";
    let body = {
                "data": {
                    "type": "data_pre_process_request",
                    "attributes": {
                            "instrument_type" : "CPL",
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
    let rawDatawNull = rawData["data"]["data"]["attributes"]["data"].replace(/\bInfinity\b/g, "null")
    let preprocessedData = JSON.parse(rawDatawNull)
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

export async function fetchCPLparams(datetime="2017-04-27") {
    /** 
    * CPL param handler
    * @summary fetches coord value, needed for the CPL data fetch.
    * @param {string} datetime - The date time of the data collected by CPL instruments
    * @return {object} with keys data and labels
    */
        let coordType = "Second";
        const apiCaller = new APICaller();
        apiCaller.setHeader('tUS7oors8qawUhT7c8QBn5OXLzH7TPgs6pmiuK2t');
    
        let url = "https://kz1ey7qvul.execute-api.us-east-1.amazonaws.com/default/sanjog-histogram-preprocessing-fcx-v1";
        let body = {
                    "data": {
                        "type": "data_pre_process_request",
                        "attributes": {
                                "instrument_type" : "CPL",
                                "datetime" : datetime,
                                "coord_type" : coordType,
                                "data_type" : "",
                                "params" : "None",
                                "pageno" : "None",
                                "pagesize" : "None",
                                "density": "None",
                            }
                        }
                    }
        let rawData = await apiCaller.post(url, body);
        let preprocessedData = JSON.parse(rawData["data"]["data"]["attributes"]["data"])
        let params = preprocessedData["coordinate_value"];
        return params.filter(onlyUnique);
    }

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
    }