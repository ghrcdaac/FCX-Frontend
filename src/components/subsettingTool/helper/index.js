import {v4 as uuidv4} from 'uuid';
import moment from "moment/moment";
import {outputSubsetsBucket} from "../../../config";

export function bodyForPost(start, end) {
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
        body: {
            subDir: `https://${outputbucket}.s3.amazonaws.com/${dir1}/${dir2}/`,
            date,
            Start: startDateTime,
            End: endDateTime,
            latRange: "-",
            lonRange: "-",
            DataSets: [
                {
                    id: "1",
                    cat_id: "CRS",
                    state: 1
                },
                {
                    id: "2",
                    cat_id: "LIP",
                    state: 1
                },
                {
                    id: "3",
                    cat_id: "FEGS",
                    state: 1
                },
                {
                    id: "4",
                    cat_id: "LMA",
                    state: 1
                },
                {
                    id: "5",
                    cat_id: "LIS",
                    state: 1
                },
                {
                    id: "6",
                    cat_id: "GLM",
                    state: 1
                },
                {
                    id: "7",
                    cat_id: "ABI",
                    state: 1
                }
            ]
        }
    }
}