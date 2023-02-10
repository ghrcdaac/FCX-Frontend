/**
 * contains meta data for each instruments. 
 */ 

/**
 * Each flight nav needs few meta data.
 * date of flight
 * file name
 * camera angle
 * 
 * NOTE:
 * 
 * How is data actually collected?
 * A campaign is set across a date range.
 * So, on a particular date, there will be a flight
 * with that there will be various instruments data
 * Along with that comes various data files; for each instrument data.
 * 
 * What we have:
 * For each instrument type, there are various data files for each date.
 * 
 * What to do:
 * 
 * For each date, collect instruments meta data (file name in s3)
 * special data for flight nav that needs to be constructed MANUALLY(??)
 * {start time: how?
 * end time: how?
 * default camera: manually, by hit and trial.} 
 *
 * FORMAT:
 * 
 * META = {
 *     "<date>": {
 *                  <instrument_1>: {
 *                                     instrument_specific_metas
 *                                  }
 *               }
 * } 
 * 
 * This meta data will be used by instrument layer generator.
 * 
 */

const META = {
    
}