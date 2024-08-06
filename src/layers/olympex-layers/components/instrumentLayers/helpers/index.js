import flighttrack from "./flightTrack";
import crs from "./crs";
import cpl from "./cpl";
import hiwrap from "./hiwrap";
import nexrad from "./nexrad";
import npol from "./npol";
import apu from "./apu";
import d3r from "./d3r";
import mrr from "./mrr";

let nexradKATX= nexrad.katx;
let nexradKRTX= nexrad.krtx;
let nexradKLGX= nexrad.klgx;

let d3rKu = d3r.ku;
let d3rKa = d3r.ka;

export { flighttrack, crs, cpl, hiwrap, nexradKATX, nexradKRTX, nexradKLGX, npol, apu, d3rKu, d3rKa, mrr }