import {v4 as uuidv4} from 'uuid';
import moment from "moment/moment";
import {outputSubsetsBucket} from "../../../config";
import { validationCheck } from './validation';

function bodyForPost(start, end) {
    /**
     * Take in start and end datetime.
     * generate a random 'dir2' (inside subset dir inside bucket)
     */
    const date = start ? moment(start).utc().format('YYYY-MM-DD') : "";
    const startDateTime = start ? moment(start).utc().format('YYYY-MM-DD HH:mm:ss') + " UTC" : "";
    const endDateTime = end ? moment(end).utc().format('YYYY-MM-DD HH:mm:ss') + " UTC" : "";
    const outputbucket = outputSubsetsBucket;
    const dir1 = "subsets";
    const dir2 = `subset-${moment().format("YYMMDDHHmmss")}-${uuidv4()}`; // unique dir, where subsets sits
    return {
        "data": {
            "type": "subset_trigger_request",
            "attributes": {
                "subDir": `https://${outputbucket}.s3.amazonaws.com/${dir1}/${dir2}/`,
                "date": date,
                "Start": startDateTime,
                "End": endDateTime
            }
        }
    }
}

export {bodyForPost, validationCheck};