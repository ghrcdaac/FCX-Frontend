import React, { Component } from "react"
import { hot } from "react-hot-loader"

import Snackbar from "@material-ui/core/Snackbar"
import Alert from "@material-ui/lab/Alert"
import { Animated } from "react-animated-css"
import moment from "moment"
import {
    Cesium3DTileset,
    Cesium3DTile,
    Cesium3DTileOptimizations,
    Cesium3DTileRefine,
    CullingVolume,
    RuntimeError,
    TimeInterval,
    defined,
    ClockRange,
    JulianDate,
    CzmlDataSource,
    CallbackProperty,
    HeadingPitchRoll,
    Transforms,
    Cartesian3,
    Cesium3DTileStyle,
    TimeIntervalCollection,
    WebMapTileServiceImageryProvider,
    ImageryLayer,
    PointPrimitiveCollection,
    NearFarScalar,
    Color as ColorCesium,
    Math as cMath,
    PinBuilder,
    Color,
    VerticalOrigin,
    Cartographic,
    BillboardGraphics
} from "cesium"

import { extendCesium3DTileset } from "temporal-3d-tile"
import { isEmpty } from "lodash"

import { supportEmail, newFieldCampaignsBaseUrl } from "../config"
import { getColorExpression, getShowExpression, loadData, getTimes, mousePosition } from "./layerFunctions"
import { checkPath } from "../helpers/path"
import emitter from "../helpers/event"
import { getLayer, adjustHeightOfPanels, getGPUInfo } from "../helpers/utils"
import { Dock, viewer } from "./dock"
import store from "../state/store"
import allActions from "../state/actions"
import { CLOCK_END_TIME_BUFFER, CLOCK_START_TIME_BUFFER } from '../constants/cesium/dates' 
import { addTimeToISODate } from "../layers/utils/layerDates"
// import { printCameraAnglesInterval } from '../helpers/cesiumHelper'

import ImageViewer from "./imageViewerModal";
import { extractLayerStartDatetime, extractLayerDate } from "../helpers/getLayerDate";

import {handleOlympexApu, handleOlympexMrr, handleOlympexD3rKa, handleOlympexD3rKu, handleOlympexNpol, handleOlympexNexrad} from './modelFunctions';

class Viz extends Component {
    
    constructor(props){
        super(props)
        this.epoch = null
        this.viewerTime = 0
        this.linger = 300
        this.activeLayers = []
        this.errorLayers = []
        this.lastSelectedLayers = []
        this.selectedFlightLayers = []
        this.savedSamera = null
        // this.trackEntity = false
        // this.trackedEntity = null
        this.trackedEntity = []
        this.pointsCollection = null
        this.Temporal3DTileset = extendCesium3DTileset({ Cesium3DTileset, Cesium3DTile, Cesium3DTileOptimizations, Cesium3DTileRefine, CullingVolume, RuntimeError, TimeInterval, defined })
        this.layerChanged = false
        this.state = {
            showImageViewer: false,
            imageViewerUrl: null
        }
    }

    renderLayers(selectedLayers, campaign) {
        /** Filter layers to remove; from active layers if its not in selected layer **/
        const layersToRemove = []
        let layersRenderPromises = [];

        for (const [, activeLayerItem] of this.activeLayers.entries()) {
            // if layer is not found in current list of selected layers, remove it
            let found = false
            for (const [, selectedLayerId] of selectedLayers.entries()) {
                if (selectedLayerId === activeLayerItem.layer.layerId) {
                    found = true
                    break
                }
            }
            if (!found) {
                layersToRemove.push(activeLayerItem)
            }
        }

        /** For layers with error, update that in global redux store. **/
        for (const e of this.errorLayers) {
            store.dispatch(allActions.listActions.markLoaded(e))
            store.dispatch(allActions.listActions.markUnLoaded(e))
        }
        /** Remove the layers, that needs to be removed. Prior remove it from cesium viewer (using 'cesiumLayerRef') **/
        for (let i = 0; i < layersToRemove.length; i++) {
            if (layersToRemove[i].layer.displayMechanism === "czml") {
                viewer.dataSources.remove(layersToRemove[i].cesiumLayerRef)
                if (layersToRemove[i].layer.shortName === "olympexd3rKa") {
                    viewer.entities.removeById("D3RKa")
                }
                if (layersToRemove[i].layer.shortName === "olympexd3rKu") {
                    viewer.entities.removeById("D3RKu")
                }
                if (layersToRemove[i].layer.shortName === "olympexnpol") {
                    viewer.entities.removeById("NPOL")
                }
                if (layersToRemove[i].layer.shortName === "olympexnexrad") {
                    viewer.entities.removeById(`NEXRAD-${layersToRemove[i].layer.displayName.split(' ')[0]}`)
                }

            } else if (layersToRemove[i].layer.displayMechanism === "3dtile" || layersToRemove[i].layer.displayMechanism === "points") {
                viewer.scene.primitives.remove(layersToRemove[i].cesiumLayerRef)
                if (layersToRemove[i].eventCallback) {
                    layersToRemove[i].eventCallback()
                }
                if (layersToRemove[i].layer.shortName === "olympexapu") {
                    viewer.entities.removeById("APU")
                    viewer.entities.removeById("APU_pin")
                }
                if (layersToRemove[i].layer.shortName === "olympexmrr") {
                    viewer.entities.removeById("MRR")
                }
            } else if (layersToRemove[i].layer.displayMechanism === "wmts") {
                viewer.imageryLayers.remove(layersToRemove[i].cesiumLayerRef)
            } else if (layersToRemove[i].layer.displayMechanism === "entities") {
                viewer.entities.remove(layersToRemove[i].cesiumLayerRef);
            }
            store.dispatch(allActions.listActions.markUnLoaded(layersToRemove[i].layer.layerId))

            this.activeLayers = this.activeLayers.filter((item) => {
                return item.layer.layerId !== layersToRemove[i].layer.layerId
            })
        }

        /** For the remainder of the selected layers, iterate over it and visualize in cesium viewer. **/
        for (const [, selectedLayerId] of selectedLayers.entries()) {
            const layer = getLayer(selectedLayerId, campaign)
            const layerDate = moment(layer.date).format("YYYY-MM-DD") //todo change to moment.utc?
            const cesiumDate = JulianDate.toDate(viewer.clock.currentTime)
            const viewerDate = moment.utc(cesiumDate).format("YYYY-MM-DD")

            if (layerDate !== viewerDate) {
                // i.e. when layers is getting changed (currentLayerDate vs OldLayerDate)
                this.layerChanged = true; // FOR CAMERA INITIAL POSITION
                // reset the layer render promise list
                layersRenderPromises.length = 0;
                // remove layers with other dates
                setTimeout(() => {
                    if(!checkPath()) return;
                    store.dispatch(allActions.listActions.removeLayersByDate(viewerDate))
                }, 1000)

                // If the campaign meta has the default camera info, set that initially, before layers load.
                if (campaign.defaultCamera && campaign.defaultCamera[layerDate] && campaign.defaultCamera[layerDate].position) {
                    // if desired camera position availabe in layer meta, use that.
                    this.restoreCamera(campaign.defaultCamera[layerDate])
                }
            } else {
                this.layerChanged = false;
            }

            let found = false
            for (const [, activeLayerItem] of this.activeLayers.entries()) {
                if (activeLayerItem.layer.layerId === selectedLayerId) {
                    found = true
                    break
                }
            }

            if (found) continue

            store.dispatch(allActions.listActions.markLoading(selectedLayerId))

            if (layer.displayMechanism === "czml") {
                let czmlPromise = this.handleCZML(layer, selectedLayerId);
                layersRenderPromises.push(czmlPromise);
            } else if (layer.displayMechanism === "3dtile") {
                let tilePromise = this.handle3dTiles(layer, selectedLayerId);
                layersRenderPromises.push(tilePromise);
            }
            else if (layer.displayMechanism === "points") {
                let pointPrimitivePromise = this.handlePointPrimitive(layer, selectedLayerId);
                layersRenderPromises.push(pointPrimitivePromise);
            }
            else if (layer.displayMechanism === "wmts") {
                let wmtsPromise = this.handleWMTS(layer, selectedLayerId);
                layersRenderPromises.push(wmtsPromise);
            }
        }

        // Fix/changes for camera zoom prioritization
        Promise.all(layersRenderPromises).then((values) => {
            if (this.activeLayers.length === 0) return
            const pactiveLayer = this.activeLayers[this.activeLayers.length - 1];
            this.prioritizedTimelineZoom(pactiveLayer, campaign);
            this.prioritizedCameraPosition(pactiveLayer, this.activeLayers, campaign);

        }).catch(error => console.error(error));
    }

    // visualization handlers for different visualization types START

    handle3dTiles(layer, selectedLayerId) {
    //use TimeDynamicPointCloud from Brian's npm package temporal-3d-tile
    const newTileset = new this.Temporal3DTileset({
        url: layer.tileLocation,
        layerId: layer.layerId, // currently not used
    })
    this.activeLayers.push({ layer: layer, cesiumLayerRef: newTileset })

    viewer.scene.primitives.add(newTileset)

    let previousTime = JulianDate.clone(viewer.clock.currentTime)

    return new Promise((resolve, reject) => {
        newTileset.readyPromise
            // eslint-disable-next-line no-loop-func
            .then((tileset) => {
                store.dispatch(allActions.listActions.markLoaded(selectedLayerId))

                this.epoch = JulianDate.fromIso8601(tileset.properties.epoch)
                tileset.style = new Cesium3DTileStyle()
                if (layer.fieldCampaignName === "IMPACTS") {
                    tileset.style.pointSize = 4.0;
                    // no need for color expression, as the color is already in the 3d tile json.
                    // if the color expression is added, it will not find value for clamp inside color expression, and hence throw error.
                } else if (layer.displayName === "Cloud Radar System") {
                    tileset.style.pointSize = 2.0;
                    tileset.style.color = getColorExpression();
                } else if (layer.displayName === "Cloud Physics LiDAR") {
                    tileset.style.pointSize = 4.0;
                    if (layer.fieldCampaignName === "Olympex" || layer.fieldCampaignName === "HS3") {
                        tileset.style.color = 'mix(color("yellow"), color("red"), -1*${value})';
                        // tileset.pointCloudShading.attenuation = true;
                    }
                } else {
                    tileset.style.pointSize = 1.0;
                    tileset.style.color = getColorExpression();
                }
                this.viewerTime = JulianDate.secondsDifference(JulianDate.clone(viewer.clock.currentTime), this.epoch)
                tileset.style.show = getShowExpression(this.viewerTime, this.linger)
                tileset.makeStyleDirty()

                emitter.on("lingerTimeChange", (value) => {
                    this.linger = value
                    tileset.style.show = getShowExpression(this.viewerTime, this.linger)
                    tileset.makeStyleDirty()
                })

                if (layer.addOnTickEventListener && layer.addOnTickEventListener === true) {
                    const eventCallback = viewer.clock.onTick.addEventListener((_e) => {
                        if (!JulianDate.equalsEpsilon(previousTime, viewer.clock.currentTime, 1)) {
                            previousTime = JulianDate.clone(viewer.clock.currentTime)
                            this.viewerTime = JulianDate.secondsDifference(previousTime, this.epoch)
                            tileset.style.show = getShowExpression(this.viewerTime, this.linger)
                            tileset.makeStyleDirty()
                        }
                    })

                    for (const [, activeLayerItem] of this.activeLayers.entries()) {
                        if (activeLayerItem.layer.layerId === layer.layerId) {
                            activeLayerItem.eventCallback = eventCallback
                            break
                        }
                    }
                }
                resolve(tileset);
            })
            .otherwise((_error) => {
                console.error(_error)
                window.alert("Error Loading Data")
                this.errorLayers.push(selectedLayerId)
                // this.activeLayers.push({ layer: layer })
                reject(_error);
            })
        });
    }

    handleCZML(layer, selectedLayerId) {
        const dataSource = new CzmlDataSource()

        if(layer.shortName === 'olympexd3rKa') {
            handleOlympexD3rKa(viewer)
        }

        if(layer.shortName === 'olympexd3rKu') {
            handleOlympexD3rKu(viewer)
        }

        if(layer.shortName === 'olympexnpol') {
            handleOlympexNpol(viewer)
        }

        if(layer.shortName === 'olympexnexrad') {
            let lon;
            let lat;
            let id;
            if(layer.displayName === 'KATX NEXRAD') {
                lon = -122.495
                lat = 48.194
                id = 'KATX'
                handleOlympexNexrad(viewer, lon, lat, id)
            } 
            if(layer.displayName === 'KLGX NEXRAD') {
                lon = -124.106
                lat = 47.11889
                id = 'KLGX'
                handleOlympexNexrad(viewer, lon, lat, id)
            }
            if(layer.displayName === 'KRTX NEXRAD') {
                lon = -122.965
                lat = 45.714
                id = 'KRTX'
                handleOlympexNexrad(viewer, lon, lat, id)
            }
        }

        // eslint-disable-next-line no-loop-func
        return new Promise((resolve, reject) => {
            dataSource.load(layer.czmlLocation).then((ds) => {
                store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
                // dropsonde and radiosonde code changes
                if (layer.type === "instrument-sonde") {
                    let instrument = layer.displayName.toLowerCase();
                    let pinReference = ds.entities.getById(`cpexaw-${instrument}-pin`);
                    const pinBuilder = new PinBuilder();
                    pinReference.billboard = new BillboardGraphics({
                        image: pinBuilder.fromColor(Color.ROYALBLUE, 48).toDataURL(),
                        verticalOrigin: VerticalOrigin.BOTTOM,
                    });

                    let modelReference = ds.entities.getById(`cpexaw-${instrument}`);
                    const position = new Cartesian3.fromDegrees(0,0,0);
                    const hpr = new HeadingPitchRoll(
                        400,
                        0,
                        0
                    );
                    const orientation = Transforms.headingPitchRollQuaternion(position, hpr);
                    modelReference.orientation = orientation;

                    viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
                        if (defined(selectedEntity) && defined(selectedEntity.name)) {
                            console.log("wowo", selectedEntity.name, selectedEntity.name.split("-")[2])
                            let date = selectedEntity.name.split("-")[2];
                            let url = `${newFieldCampaignsBaseUrl}/CPEX-AW/instrument-processed-data/${instrument}/skewT/${date}/${instrument}.png`;
                            this.setImageViewerState(true, url);
                        }
                    });
                    
                }
                if (layer.type === "track") {
                    let modelReference = ds.entities.getById("Flight Track");
                    modelReference.orientation = new CallbackProperty((time, _result) => {
                        const position = modelReference.position.getValue(time)
                        // needed for flight nav roll pitch and head correction.
                        let roll = modelReference.properties.roll.getValue(time);
                        let pitch = modelReference.properties.pitch.getValue(time);
                        let heading = modelReference.properties.heading.getValue(time);
                        const hpr = new HeadingPitchRoll(heading, pitch, roll)
                        return Transforms.headingPitchRollQuaternion(position, hpr)
                    }, false)
                    // this.trackedEntity = dataSource.entities.getById("Flight Track") // entity to be tracked.
                    this.trackedEntity[selectedLayerId] = ds.entities.getById("Flight Track") // entity to be tracked.
                    emitter.emit("receiveFlightLayers", store.getState().selectedLayers);
                    if (this.trackEntity) {
                        // if track airplane is checked, then keep tracking the airplane.
                        viewer.trackedEntity = this.trackedEntity
                        viewer.clock.shouldAnimate = true
                        viewer.clock.canAnimate = true
                    }
                }
                this.activeLayers.push({ layer: layer, cesiumLayerRef: ds })
                viewer.dataSources.add(ds)
                resolve(ds);
            }).otherwise((_error) => {
                console.error(_error)
                window.alert("Error Loading Data")
                this.errorLayers.push(selectedLayerId)
                reject(_error);
            })
        });
    }

    handlePointPrimitive(layer, selectedLayerId) {
        const intvl = (layer.shortName === 'olympexmrr') ? 1 : 60;
        const promiseG = Promise.resolve(loadData(layer.tileLocation));
        return new Promise((resolve, reject) => {
            Promise.all([promiseG]).then(([LightningData]) => {
                const timingsArray = getTimes(LightningData);
                let lastTime =this.viewerTime;
                let timesLen = timingsArray.length;
                let initialTime = timingsArray[0];
                let endTime = timingsArray[timesLen - 1];

                this.pointsCollection = viewer.scene.primitives.add(new PointPrimitiveCollection());
                this.activeLayers.push({ layer: layer, cesiumLayerRef: this.pointsCollection })

                if(layer.shortName === 'olympexapu') {
                    handleOlympexApu(viewer, LightningData[0].Lon[0], LightningData[0].Lat[0], (pin) => {
                        this.activeLayers.push({ layer: { ...layer, displayMechanism: "entities" }, cesiumLayerRef: pin });
                        viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
                            if (defined(selectedEntity) && defined(selectedEntity.name)) {
                                // TODO: Change the hardcoded url
                                let url = 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/apu/apu_plots1.png';
                                this.setImageViewerState(true, url);
                            }
                        });
                    });
                } 

                if(layer.shortName === 'olympexmrr') {
                    handleOlympexMrr(viewer, LightningData[0].Lon[0], LightningData[0].Lat[0])
                } 

                store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
                /*  Display lightning on clock ticking */

                if (layer.addOnTickEventListener && layer.addOnTickEventListener === true) {

                    const eventCallback = viewer.clock.onTick.addEventListener((_e) => {
                        let previousTime = JulianDate.clone(viewer.clock.currentTime);

                        const startTime = JulianDate.fromIso8601(layer.date + "T00:00:00Z");
                        let viewTime = JulianDate.secondsDifference(previousTime, startTime);
                        let pT60 = lastTime - lastTime % intvl;
                        let vT60 = viewTime - viewTime % intvl;

                        // remove points at off-interval
                        if (layer.shortName !== 'olympexmrr' & vT60 !== pT60 & pT60 >= initialTime & pT60 <= endTime) {
                            let indx = timingsArray.indexOf(pT60);
                            if (indx >= 0) {
                                this.pointsCollection.removeAll();
                            }
                        }

                        // add points on 60s time interval
                        if (vT60 >= initialTime & vT60 <= endTime) {
                            let indx = timingsArray.indexOf(vT60);
                            if (indx >= 0 & vT60 !== pT60) {
                                let nFScalar = new NearFarScalar(1.e2, 2, 8.0e6, 0.5);
                                let yellow = new ColorCesium(1.0, 1.0, 0.4, 1);
                                let cyan = new ColorCesium(0.68, 1.0, 0.55, .6);  //Cesium.Color.CYAN;
                                let orng = ColorCesium.ORANGE.brighten(0.5, new ColorCesium());
                                let vec = LightningData[indx];
                                let lon = vec.Lon;
                                let lat = vec.Lat;
                                let rad = vec.Rad;
                                let pw = 0.6;
                                let fct = 1 / 15;
                                let color = yellow;
                                if (layer.dispType === 'Activity') {
                                    pw = 0.6;
                                    fct = 1 / 4;
                                    color = orng;
                                    rad = vec.count;
                                }
                                if (layer.dispType === 'LIntensity') {
                                    pw = .5;
                                    fct = 1 / 100;
                                    color = cyan;
                                    rad = vec.Rad;
                                }

                                if (layer.shortName === 'olympexmrr') {
                                    this.pointsCollection.removeAll(); //to keep showing a set of points until next occurrence
                                    let pointColor = vec.Color;
                                    let alt = vec.Alt;
                                    for (let i = 0; i < alt.length; i += 1) {
                                        this.pointsCollection.add({
                                            id: layer.dispType + parseInt(i, 10),
                                            show: true,
                                            position: Cartesian3.fromDegrees(lon[i], lat[i], alt[i]+1000), //adding offset height to clearly display points and not hide behind the model
                                            pixelSize: 7.0,
                                            color: new ColorCesium(pointColor[i][0], pointColor[i][1], pointColor[i][2], pointColor[i][3]),
                                            scaleByDistance: nFScalar,
                                        });
                                    }
                                } else {
                                    for (let i = 0; i < lon.length; i += 1) {
                                        if(layer.shortName === 'olympexapu') {
                                            this.pointsCollection.add({
                                                id: layer.shortName + parseInt(i, 10),
                                                show: true,
                                                position: Cartesian3.fromDegrees(lon[i], lat[i], 10000),
                                                pixelSize: 100,
                                                color: new ColorCesium(vec.r, 0.0, vec.b, 1),
                                                outlineColor: Color.WHITE,
                                                outlineWidth: 2,
                                                scaleByDistance: new NearFarScalar(1e3, 2.0, 1e5, 0.2)
                                            });
                                        } else {
                                            let pixel = Math.pow(rad[i], pw) * fct
                                            this.pointsCollection.add({
                                                id: layer.dispType + parseInt(i, 10),   //id+'_'+parseInt(i,10),
                                                show: true,
                                                position: Cartesian3.fromDegrees(lon[i], lat[i], 0),
                                                pixelSize: pixel,
                                                color: color,
                                                scaleByDistance: nFScalar,
                                            });
                                        }
                                    };
                                }
                            }
                        }
                        lastTime = viewTime;
                    });

                    for (const [, activeLayerItem] of this.activeLayers.entries()) {
                        if (activeLayerItem.layer.layerId === layer.layerId) {
                            activeLayerItem.eventCallback = eventCallback
                            break
                        }
                    }
                }
                /*--- mouse functions  ---*/
                mousePosition(viewer);
                resolve(LightningData);
            }).catch(_error => {
                console.error(_error)
                window.alert("Error Loading Data")
                this.errorLayers.push(selectedLayerId)
                reject(_error);
            })
        });
    }

    handleWMTS(layer, selectedLayerId) {
        const times = layer.times
        const dates = []
        for (const time of times) {
            const date = new JulianDate()
            JulianDate.addSeconds(JulianDate.fromIso8601("2000-01-01T12:00:00Z"), Number(time), date)
            dates.push(date)
        }
        const timeIntervalCollection = TimeIntervalCollection.fromJulianDateArray({
            julianDates: dates,
            dataCallback: (_interval, index) => {
                return { Time: times[index] }
            },
        })

        /*
        Useful links
        https://cesium.com/docs/tutorials/imagery-layers/
        https://sandcastle.cesium.com/?src=Imagery%20Adjustment.html
        */

        let imageryProvider = new WebMapTileServiceImageryProvider({
            url: layer.url,
            format: layer.format,
            style: layer.style,
            times: timeIntervalCollection,
            tileMatrixSetID: layer.tileMatrixSetID,
            clock: viewer.clock,
            layer: layer.layer,
        })
        let imageLayer = new ImageryLayer(imageryProvider)
        viewer.imageryLayers.add(imageLayer)
        this.activeLayers.push({ layer: layer, cesiumLayerRef: imageLayer })
        return new Promise((resolve, reject) => {
            imageryProvider.readyPromise.then((status) => {
                if (status) {
                    store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
                    resolve(status);
                }
            })
        });
    }

    // visualization handlers for different visualization types END


    // Priority based cesium clock, timeline zoom and camera position handler START

    extractPrioritizedLayer = (activeLayers) => {
        /**
         * This function prioritizes the timeline zooming.
         * ie. gets the datetime for the cesium viewer, to set and zoom into.
         * Details:
         * Because every layers is a representation of temporal and spatial data, all of them have time information.
         * Instead of setting the cesium viewer to the arbitrary layer time,
         * We can prioritize the cesium clock-time to the most important layer.
         * and have every other layer to be in sync with that.
         * @param  {Array} activeLayers  array of active layer objects. Active layer objects are entity or primitive type cesium objects.
         * @return {Object}              Highest Prioritized active layer.
         */
        if (activeLayers.length === 1) {
            return activeLayers[0];
        }
        let priorityEnum = {
            '3dtile': 0,
            'czml': 1,
            'points': 2,
            'entities': 3,
            'wmts': 4
        }
        activeLayers.sort((el1, el2) => {
            // if return -ve, pushed to back
            // if returned +ve, pushed to front
            let order1 = priorityEnum[el1.layer.displayMechanism]
            let order2 = priorityEnum[el2.layer.displayMechanism]
            if (order1 === undefined) return -1;
            if (order2 === undefined) return 1;
            if (order1 === order2) {
                // Possible Enhancement: now based off the start time, sort it.
                // i.e. the one with the later start time, will be pushed to the front.
                // As it is the interection of the both layers. (wrt time)
                // and contains data of both the layers.
                // For now, order is untouched if priority is same.
            }
            return order1 - order2;
        });
        return activeLayers[0];
    }

    prioritizedTimelineZoom = (layer, campaign) => {
        // get start datetime from that layer
        const layerStartDateTime = extractLayerStartDatetime(layer, campaign);
        const date = extractLayerDate(layer);
        const campaignStartDateTime = `${date}T00:00:00Z`;
        const campaignEndDateTime = `${date}T23:59:59Z`;
        if (layerStartDateTime) {
            viewer.automaticallyTrackDataSourceClocks = false;
            viewer.clock.currentTime = JulianDate.fromIso8601(layerStartDateTime);
        } else {
            // automatically set the clock using the loaded data.
            viewer.automaticallyTrackDataSourceClocks = true;
        }
        // always do the following
        viewer.clock.startTime = JulianDate.fromIso8601(campaignStartDateTime);
        viewer.clock.stopTime = JulianDate.fromIso8601(campaignEndDateTime);
        viewer.timeline.zoomTo(JulianDate.fromIso8601(campaignStartDateTime), JulianDate.fromIso8601(campaignEndDateTime));
    }

    prioritizedCameraPosition = (prioritizedActiveLayer, activeLayers, campaign) => {
        let useFlightNavForCameraPosition =  false;
        let flightLayerObject = null;
        // if the campaign meta has a hardcoded inline camera position for a given date, use that
        let layerDate = moment(activeLayers[0].layer.date).format("YYYY-MM-DD")
        if (campaign.defaultCamera && campaign.defaultCamera[layerDate] && campaign.defaultCamera[layerDate].position) {
            // if desired camera position availabe in layer meta, use that.
            this.restoreCamera(campaign.defaultCamera[layerDate]);
            return;
        }
        
        if (useFlightNavForCameraPosition && flightLayerObject) {
            const {cesiumLayerRef: dataSource} = flightLayerObject;
            let modelReference = dataSource.entities.getById("Flight Track");
            modelReference.orientation = new CallbackProperty((time, _result) => {
                const position = modelReference.position.getValue(time)
                if (this.layerChanged) {
                    // Run it only once in the initial
                    this.setCameraDefaultInitialPosition(viewer, position);
                    this.layerChanged = false; // As the default camera posn is changed, and only want to happen it in the initial
                }
                // needed for flight nav roll pitch and head correction.
                let roll = modelReference.properties.roll.getValue(time);
                let pitch = modelReference.properties.pitch.getValue(time);
                let heading = modelReference.properties.heading.getValue(time);
                const hpr = new HeadingPitchRoll(heading, pitch, roll)
                return Transforms.headingPitchRollQuaternion(position, hpr)
            }, false)
            return
        }
        // else zoom to the prioritized layer
        if (prioritizedActiveLayer.layer.displayMechanism === "czml") {
            const {cesiumLayerRef: dataSource} = prioritizedActiveLayer;
            viewer.zoomTo(dataSource);
            return;
        }
        if (prioritizedActiveLayer.layer.displayMechanism === "3dtile" ) {
            const {cesiumLayerRef: tileset} = prioritizedActiveLayer;
            viewer.zoomTo(tileset);
            return;
        }
        if (prioritizedActiveLayer.layer.dispType === "RainIntensity" || prioritizedActiveLayer.layer.dispType === "MRRIntensity") {
            var heading = 5.65;
            var pitch = -0.17;
            var roll = 0;
            let entity = viewer.entities.getById("APU")
            if (!entity) {
                entity = viewer.entities.getById("MRR")
            }
            var cartographicPosition = new Cartographic.fromCartesian(entity.position.getValue(JulianDate.now()));
            var latitude = cMath.toDegrees(cartographicPosition.latitude) - 0.5;
            var longitude = cMath.toDegrees(cartographicPosition.longitude) + 0.5; // Need to adjust after trying with other dates
            viewer.camera.flyTo({
                destination: Cartesian3.fromDegrees(longitude, latitude, 9990),
                orientation: {
                    heading: heading,
                    pitch: pitch,
                    roll: roll
                }
            });
            return;
        } 
    }

    // Priority based cesium clock, timeline zoom and camera position handler END


    // Utils START

    setImageViewerState = (showImageViewer, imageViewerUrl) => {
        // arrow function to bind this wrt the class and not the callers' this
        if (imageViewerUrl) {
            this.setState({showImageViewer, imageViewerUrl})
        } else {
            this.setState({showImageViewer})
        }
    }

    setCameraDefaultInitialPosition = (viewer, position) => {
    /**
    * Sets the camera to the initial position of the flight aircraft entity and sets the reference frame to view it from orthographic view.
    * Immediately untracks the aircraft entity. This leave the reference frame to desired position while allowing the mouse movement.
    * @param {object} viewer - cesium viewer (viewport) object instance. camera is attached to the viewer.
    * @param {object} position - position of the aircraft entity.
    */
        const transform = Transforms.eastNorthUpToFixedFrame(position);

        const camera = viewer.camera;
        camera.lookAtTransform(
            transform,
            new Cartesian3(20000.0, -20000.0, 20000.0)
        );
        viewer.trackedEntity = this.trackEntity; //just making tracked entity null, will not work. Need to set it to some other entity first.
        viewer.trackedEntity = null;
        return;
    }

    readStateAndRender(campaign) {
        const selectedLayers = store.getState().selectedLayers
        if (JSON.stringify(this.lastSelectedLayers) !== JSON.stringify(selectedLayers)) {
            this.lastSelectedLayers = selectedLayers
            this.renderLayers(selectedLayers, campaign)
            emitter.emit("receiveFlightLayers", selectedLayers)
        }
    }

    multipleFlightsFollowAirplane() {
        const selectedLayers = store.getState().selectedLayers;
        console.log(selectedLayers, "follow airplane", this.lastSelectedLayers)
        setTimeout(() => this.countTrackLayers(this.lastSelectedLayers), 1000);
    }
    countTrackLayers(selectedFlightLayers) {
        // Filter the array for elements containing 'track' and get the length of the filtered array
        this.selectedFlightLayers = selectedFlightLayers.filter(layer =>
            layer.toLowerCase().includes('track')
        );
        console.log(`Number of layers containing 'track': ${this.selectedFlightLayers.length}`);
    }; 

    restoreCamera(cameraObj, updateTime = true) {
        if (cameraObj) {
            let camera = viewer.scene.camera
            camera.position = {...cameraObj.position}
            camera.direction = {...cameraObj.direction}
            camera.up = {...cameraObj.up}
            camera.right = {...cameraObj.right}
            if (updateTime && cameraObj.currentTime) {
                viewer.clock.currentTime = {...cameraObj.currentTime}
            }
        }
    }

    modelOrientationCorrection = ({roll, pitch, heading}) => { // inputs in radian
        /**
         * If the orientation is wrong,
         * use this function to correct orientation
         * before changing in backend,
         * For quick visible change.
         */
        let modelCorrectionOffsets = {
            roll: 0, // degrees
            pitch: 0, // degrees
            heading: 0 // degrees
        };
        // outputs in radian
        return {
            roll: roll + cMath.toRadians(modelCorrectionOffsets.roll),
            pitch: pitch + cMath.toRadians(modelCorrectionOffsets.pitch),
            heading: heading + cMath.toRadians(modelCorrectionOffsets.heading)
        }
    }

    // Utils END

    componentDidMount() {
        /** Fetch the campaign **/
        const campaign = (() => this.props.campaign)()

        /** Error messages if viewer or campaign missing **/

        // printCameraAnglesInterval(viewer)
        if (!viewer) {
            alert(`Error: Viewer failed to initialize. Please contact support team at ${supportEmail}`)
        }
        
        if (isEmpty(campaign)) {
            alert(`Error: Couldn't fetch the data. Please contact support team at ${supportEmail}`)
        }
        
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((_tiles) => { })

        viewer.imageryLayers.layerAdded.addEventListener((layer) => {
            if (layer.imageryProvider) {
                // we can raise an event here for imagery ${layer.imageryProvider.url} loaded
            }
        })
      
        /** Set Viewer clock settings **/

        viewer.clock.clockRange = ClockRange.LOOP_STOP
        viewer.clock.multiplier = 10

        /** Save the camera instance, after camera is set in viewer **/

        setInterval(() => {
            let camera = viewer.scene.camera
            this.savedSamera = {
                position: camera.position,
                direction: camera.direction,
                up: camera.up,
                right: camera.right,
                currentTime: viewer.clock.currentTime,
            }
        }, 2000)

        /** Select current set of layers (in component state); by checking if layers changed (using redux store) **/

        //check for default selected layers
        this.readStateAndRender(campaign)

        store.subscribe(() => {
            this.readStateAndRender(campaign)
        })

        /******* EVENT LISTNERS *******/

        /** Prepare layers to render, if the dock where cesium is displayed is ready. **/
        emitter.on("dockRender", () => {
            setTimeout(() => {
                if (!checkPath()) return
                let entitiesLength = viewer.entities.values.length
                let dataSourcesLength = viewer.dataSources.length
                let primitiesLength = viewer.scene.primitives.length
                if (entitiesLength === 0 && dataSourcesLength === 0 && primitiesLength === 0) {
                    this.activeLayers = []
                    if (this.lastSelectedLayers.length !== 0) {
                        this.renderLayers(this.lastSelectedLayers, campaign)
                        // clock:: current time set
                        this.restoreCamera(this.savedSamera)
                        //TODO: viewer's current time is not getting restored
                    }
                }
            }, 1000)
        })

        emitter.on("tabLayoutChange", () => {
            adjustHeightOfPanels()
        })

        emitter.on("trackairplaneChange", (selectedFlightLayer) => {
            if (selectedFlightLayer) { 
                setTimeout(() => {
                    viewer.trackedEntity = this.trackedEntity[selectedFlightLayer]
                    viewer.clock.shouldAnimate = true
                    viewer.clock.canAnimate = true
                }, 1000)
            } else {
                viewer.trackedEntity = null                
            }
        })

        emitter.on("requestFlightLayers", () => {
            emitter.emit("receiveFlightLayers", store.getState().selectedLayers);
        }); 

        emitter.on("listcheck", (selectedLayers) => {
            this.lastSelectedLayers = selectedLayers
            this.renderLayers(selectedLayers, campaign)
        })


        /** Adjust the height of dock where cesium is displayed. **/

        adjustHeightOfPanels()

        setTimeout(() => {
            if (!checkPath()) return
            adjustHeightOfPanels()
        }, 5000)

        /** display logos on initial load. Kind of splash screen **/
        setTimeout(() => {
            if (!checkPath()) return
            let logoElement = document.querySelector(".fcx-logo")
            if(logoElement?.parentNode){
                logoElement.parentNode.removeChild(logoElement)
            }
            let alertElement = document.querySelector("#alert-gpu")
            if (alertElement?.parentNode) {
                alertElement.parentNode.removeChild(alertElement)
            }
        }, 5000)
    }

    render() {
        let gpuInfo = getGPUInfo()

        return (
            <div
                className={"main"}
            >
                <Snackbar id="alert-gpu" anchorOrigin={{ vertical: "top", horizontal: "center" }} open={!gpuInfo.discreteGPU} key="alert-gpu">
                    <Alert severity="error">Note: Your current GPU is {gpuInfo.gpuName}. The performance of Field campaign Explorer will depend performance of your GPU. A discrete GPU is recommended.</Alert>
                </Snackbar>

                <div className="fcx-logo animate__rotateIn">
                    <Animated animationIn="tada" animationOut="rollOut" animationInDuration={5000} animationOutDuration={1000} isVisible={true}>
                        <img alt="FCX Logo" className="centered" src={`${process.env.PUBLIC_URL}/fcx_logo.png`} />
                    </Animated>
                </div>

                <Dock campaign={this.props.campaign} />
                {this.state.showImageViewer && <ImageViewer imageUrl= {this.state.imageViewerUrl} showImageViewer={this.state.showImageViewer} setImageViewerState={this.setImageViewerState}/>}
            </div>
        )
    }
}

export default hot(module)(Viz)
