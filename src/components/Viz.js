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
    Math as cMath
} from "cesium"

import { extendCesium3DTileset } from "temporal-3d-tile"
import { isEmpty } from "lodash"

import { supportEmail } from "../config"
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

class Viz extends Component {
    
    constructor(props){
        super(props)
        this.epoch = null
        this.viewerTime = 0
        this.linger = 300
        this.activeLayers = []
        this.errorLayers = []
        this.lastSelectedLayers = []
        this.savedSamera = null
        this.trackEntity = false
        this.trackedEntity = null
        this.pointsCollection = null
        this.Temporal3DTileset = extendCesium3DTileset({ Cesium3DTileset, Cesium3DTile, Cesium3DTileOptimizations, Cesium3DTileRefine, CullingVolume, RuntimeError, TimeInterval, defined })
        this.layerChanged = false
    }

    renderLayers(selectedLayers, campaign) {
        /** Filter layers to remove; from active layers if its not in selected layer **/
        const layersToRemove = []
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
            } else if (layersToRemove[i].layer.displayMechanism === "3dtile" || layersToRemove[i].layer.displayMechanism === "points") {
                /** If the removal is for NPOL dataset, remember it contanins set of layers for a single date.
                 * So, remove all those referenced layers by iterating over all those freq-20-mins layers.
                 * **/
                viewer.scene.primitives.remove(layersToRemove[i].cesiumLayerRef)
                if (layersToRemove[i].eventCallback) {
                    layersToRemove[i].eventCallback()
                }
            } else if (layersToRemove[i].layer.displayMechanism === "wmts") {
                viewer.imageryLayers.remove(layersToRemove[i].cesiumLayerRef)
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
            
            const viewerStart = layer.start && addTimeToISODate(layer.start, -CLOCK_START_TIME_BUFFER)
            const viewerEnd = layer.end && addTimeToISODate(layer.end, CLOCK_END_TIME_BUFFER)

            if (layerDate !== viewerDate) {
                // i.e. when layers is getting changed (currentLayerDate vs OldLayerDate)
                this.layerChanged = true; // FOR CAMERA INITIAL POSITION
                // remove layers with other dates
                setTimeout(() => {
                    if(!checkPath()) return;
                    store.dispatch(allActions.listActions.removeLayersByDate(viewerDate))
                }, 1000)

                if (viewerStart) viewer.clock.currentTime = JulianDate.fromIso8601(viewerStart)

                if (campaign.defaultCamera && campaign.defaultCamera[layerDate] && campaign.defaultCamera[layerDate].position) {
                    // if desired camera position availabe in layer meta, use that.
                    this.restoreCamera(campaign.defaultCamera[layerDate])
                }
            } else {
                this.layerChanged = false;
            }

            if ( viewerStart && viewerEnd ) {
                // if desired zoom time availabe in layer meta, use that.
                viewer.automaticallyTrackDataSourceClocks = false; // TODO: not working currently check
                viewer.clock.startTime = JulianDate.fromIso8601(viewerStart)
                viewer.clock.stopTime = JulianDate.fromIso8601(viewerEnd)
                viewer.timeline.zoomTo(JulianDate.fromIso8601(viewerStart), JulianDate.fromIso8601(viewerEnd))
            } else {
                // automatically set the clock using the czml data.
                viewer.automaticallyTrackDataSourceClocks = true;
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
                const dataSource = new CzmlDataSource()
                // eslint-disable-next-line no-loop-func
                dataSource.load(layer.czmlLocation).then((ds) => {
                    store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
                    if (layer.type === "track") {
                        let modelReference = ds.entities.getById("Flight Track");
                        modelReference.orientation = new CallbackProperty((time, _result) => {
                            const position = modelReference.position.getValue(time)
                            if (this.layerChanged) {
                                // Run it only once in the initial
                                this.setCameraDefaultInitialPosition(viewer, position);
                                this.layerChanged = false; // As the default camera posn is changed, and only want to happen it in the initial
                            }
                            let roll = modelReference.properties.roll.getValue(time);
                            let pitch = modelReference.properties.pitch.getValue(time);
                            let heading = modelReference.properties.heading.getValue(time);
                            const hpr = new HeadingPitchRoll(heading, pitch, roll)
                            return Transforms.headingPitchRollQuaternion(position, hpr)
                        }, false)

                        this.trackedEntity = ds.entities.getById("Flight Track")
                        // this.trackedEntity.viewFrom = new Cartesian3(-30000, -70000, 50000)
                        if (this.trackEntity) {
                            viewer.trackedEntity = this.trackedEntity
                            viewer.clock.shouldAnimate = true
                            viewer.clock.canAnimate = true
                        }
                    } else if (layer.type === "imagery") {
                        if (!this.trackEntity) viewer.zoomTo(ds);
                    }

                    this.activeLayers.push({ layer: layer, cesiumLayerRef: ds })
                    viewer.dataSources.add(ds)
                }).otherwise((_error) => {
                    console.error(_error)
                    window.alert("Error Loading Data")
                    this.errorLayers.push(selectedLayerId)
                })
            } else if (layer.displayMechanism === "3dtile") {
                if(layer.tileLocation instanceof Array) {
                    return layer.tileLocation.forEach((location, index) => {
                        let modifiedLayer = {...layer, tileLocation: location, layerId: `${layer.layerId}-${index}`}
                        return this.handle3dTiles(modifiedLayer, selectedLayerId)
                    });
                }
                return this.handle3dTiles(layer, selectedLayerId)
                /** If 3d tile is for NPOL insturment, it has several 3d tiles (per 20 mins) across a single day
                 * So, for all those 3d tiles, add it to viewer scene primitive.
                 * Then create a list of cesium layer refs. (Later needed for removal.)
                 * **/

                //use TimeDynamicPointCloud from Brian's npm package temporal-3d-tile
                const newTileset = new this.Temporal3DTileset({
                    url: layer.tileLocation,
                    layerId: layer.layerId, // currently not used
                })
                this.activeLayers.push({ layer: layer, cesiumLayerRef: newTileset })

                viewer.scene.primitives.add(newTileset)

                let previousTime = JulianDate.clone(viewer.clock.currentTime)

                newTileset.readyPromise
                    // eslint-disable-next-line no-loop-func
                    .then((tileset) => {
                        store.dispatch(allActions.listActions.markLoaded(selectedLayerId))

                        this.epoch = JulianDate.fromIso8601(tileset.properties.epoch)
                        tileset.style = new Cesium3DTileStyle()
                        if (layer.displayName === "Cloud Radar System") {
                            tileset.style.pointSize = 2.0;
                            tileset.style.color = getColorExpression();
                        } else if (layer.displayName === "Cloud Physics LiDAR") {
                            tileset.style.pointSize = 4.0;
                            if (layer.fieldCampaignName === "Olympex") {
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
                    })
                    .otherwise((_error) => {
                    console.error(_error)
                        window.alert("Error Loading Data")
                        this.errorLayers.push(selectedLayerId)
                        // this.activeLayers.push({ layer: layer })
                    })
            }
            else if (layer.displayMechanism === "points") {

                const intvl = 60;
                const promiseG = Promise.resolve(loadData(layer.tileLocation));
                Promise.all([promiseG]).then(([LightningData]) => {
                    const timingsArray = getTimes(LightningData);
                    let lastTime =this.viewerTime;
                    let timesLen = timingsArray.length;
                    let initialTime = timingsArray[0];
                    let endTime = timingsArray[timesLen - 1];

                    this.pointsCollection = viewer.scene.primitives.add(new PointPrimitiveCollection());
                    this.activeLayers.push({ layer: layer, cesiumLayerRef: this.pointsCollection })

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
                            if (vT60 !== pT60 & pT60 >= initialTime & pT60 <= endTime) {
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

                                    for (let i = 0; i < lon.length; i += 1) {
                                        let pixel = Math.pow(rad[i], pw) * fct
                                        this.pointsCollection.add({
                                            id: layer.dispType + parseInt(i, 10),   //id+'_'+parseInt(i,10),
                                            show: true,
                                            position: Cartesian3.fromDegrees(lon[i], lat[i], 0),
                                            pixelSize: pixel,
                                            color: color,
                                            scaleByDistance: nFScalar,
                                        });
                                    };
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

                }).catch(_error => {
                    console.error(_error)
                    window.alert("Error Loading Data")
                    this.errorLayers.push(selectedLayerId)
                })

            }
            else if (layer.displayMechanism === "wmts") {

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

                imageryProvider.readyPromise.then((status) => {
                    if (status) {
                        store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
                    }
                })


            }
        }
    }

    // first try of breaking the visualization handlers for different visualization types.

    handle3dTiles(layer, selectedLayerId) {
    /** If 3d tile is for NPOL insturment, it has several 3d tiles (per 20 mins) across a single day
     * So, for all those 3d tiles, add it to viewer scene primitive.
     * Then create a list of cesium layer refs. (Later needed for removal.)
     * **/

    //use TimeDynamicPointCloud from Brian's npm package temporal-3d-tile
    const newTileset = new this.Temporal3DTileset({
        url: layer.tileLocation,
        layerId: layer.layerId, // currently not used
    })
    this.activeLayers.push({ layer: layer, cesiumLayerRef: newTileset })

    viewer.scene.primitives.add(newTileset)

    let previousTime = JulianDate.clone(viewer.clock.currentTime)

    newTileset.readyPromise
        // eslint-disable-next-line no-loop-func
        .then((tileset) => {
            store.dispatch(allActions.listActions.markLoaded(selectedLayerId))

            this.epoch = JulianDate.fromIso8601(tileset.properties.epoch)
            tileset.style = new Cesium3DTileStyle()
            if (layer.displayName === "Cloud Radar System") {
                tileset.style.pointSize = 2.0;
                tileset.style.color = getColorExpression();
            } else if (layer.displayName === "Cloud Physics LiDAR") {
                tileset.style.pointSize = 4.0;
                if (layer.fieldCampaignName === "Olympex") {
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
        })
        .otherwise((_error) => {
        console.error(_error)
            window.alert("Error Loading Data")
            this.errorLayers.push(selectedLayerId)
            // this.activeLayers.push({ layer: layer })
        })
    }

    setCameraDefaultInitialPosition(viewer, position) {
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
            new Cartesian3(20000.0, 20000.0, 20000.0)
        );
        viewer.trackedEntity = null;
        return;
    }

    readStateAndRender(campaign) {
        const selectedLayers = store.getState().selectedLayers
        if (JSON.stringify(this.lastSelectedLayers) !== JSON.stringify(selectedLayers)) {
            this.lastSelectedLayers = selectedLayers
            this.renderLayers(selectedLayers, campaign)
        }
    }

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
                        this.restoreCamera(this.savedSamera)
                        //TODO: viewer's current time is not getting restored
                    }
                }
            }, 1000)
        })

        emitter.on("tabLayoutChange", () => {
            adjustHeightOfPanels()
        })

        emitter.on("trackairplaneChange", (checked) => {
            if (checked) {
                this.trackEntity = true
                viewer.trackedEntity = this.trackedEntity
                viewer.clock.shouldAnimate = true
                viewer.clock.canAnimate = true
            } else {
                this.trackEntity = false
                viewer.trackedEntity = null
            }
        })

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
            </div>
        )
    }
}

export default hot(module)(Viz)
