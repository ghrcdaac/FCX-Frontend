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
    VerticalOrigin
} from "cesium"

import { extendCesium3DTileset } from "temporal-3d-tile"
import { isEmpty } from "lodash"

import { supportEmail, newFieldCampaignsBaseUrl } from "../config"
import { getColorExpression, getShowExpression, loadData, getTimes, mousePosition } from "./layerFunctions"
import { checkPath } from "../helpers/path"
import emitter from "../helpers/event"
import { getLayer, adjustHeightOfPanels, getGPUInfo } from "../helpers/utils"
import { Dock, viewer, getViewer } from "./dock"
import store from "../state/store"
import allActions from "../state/actions"
import { CLOCK_END_TIME_BUFFER, CLOCK_START_TIME_BUFFER } from '../constants/cesium/dates' 
import { addTimeToISODate } from "../layers/utils/layerDates"
// import { printCameraAnglesInterval } from '../helpers/cesiumHelper'

import ImageViewer from "./imageViewerModal";
import { extractLayerStartDatetime, extractLayerDate, viewerDateMatchesLayer } from "../helpers/getLayerDate";
import { loadDow7Layer, unloadDow7Layer, flyToDow7InitialView, syncDow7MultiLayerVisibility } from "../helpers/dow7LayerHandler";
import { loadLma3dtileLayer, unloadLma3dtileLayer } from "../helpers/lma3dtileLayerHandler";
import { loadSoundingCzmlLayer, unloadSoundingCzmlLayer, applySoundingCzmlClockToViewer } from "../helpers/soundingCzmlLayerHandler";
import { loadEfmLayer, unloadEfmLayer, applyEfmViewerClock } from "../helpers/efmLayerHandler";
import { loadNexradLayer, unloadNexradLayer, unloadAllNexradLayers, applyNexradViewerClock, abortNexradLayerLoad } from "../helpers/nexradLayerHandler";
import { loadGlmLayer, unloadGlmLayer, applyGlmViewerClock } from "../helpers/glmLayerHandler";
import { startLayerLoad, cancelLayerLoad } from "../helpers/layerLoadSession";
import {
  applyCombinedLeeLayersClock,
  pickLeeLayersOnListingDate,
  shouldUseLeeDatasetClock,
} from "../helpers/leeCombinedClock";
import {
  registerLeeInstrumentClockSync,
  syncLeeInstrumentsAtViewerTime,
  unregisterLeeInstrumentClockSync,
} from "../helpers/leeInstrumentSync";
import {
  shouldLeeRegionalLayerFlyOnLoad,
  shouldLeeWideAreaLayerFlyOnLoad,
  shouldUseLeeRegionalCamera,
  shouldUseLeeWideAreaCamera,
  shouldUseLeeMultiInstrumentCamera,
  isLeeWideAreaLayer,
  flyToLeeCamera,
  getLeeMultiInstrumentCamera,
  LEE_GLM_CONTINENTAL_CAMERA,
  LEE_REGIONAL_CAMERA,
} from "../helpers/leeCameraPolicy";

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
        this.leeClockSync = { handler: null, timelineHandler: null }
        this.state = {
            showImageViewer: false,
            imageViewerUrl: null
        }
    }

    isLayerSelected(layerId, selectedLayers = store.getState().selectedLayers) {
        return selectedLayers.includes(layerId)
    }

    isLeeDow7Selected(campaign, selectedLayers = store.getState().selectedLayers) {
        return (selectedLayers || []).some((layerId) => {
            const layer = getLayer(layerId, campaign)
            return (
                layer?.fieldCampaignName === "LEE" &&
                layer?.displayMechanism === "dow7"
            )
        })
    }

    abandonStaleLayerLoad(layerId, unloadFn, refs) {
        if (refs) {
            unloadFn(viewer, refs)
        }
        store.dispatch(allActions.listActions.markUnLoaded(layerId))
    }

    getLeeLoadOptions(layer, selectedLayerId) {
        if (layer?.fieldCampaignName !== "LEE") {
            return {}
        }

        const campaign = this.props.campaign
        const listingDate = layer.listingDate || layer.date
        const selectedIds = store.getState().selectedLayers || []
        const selectedLeeOnDate = selectedIds.filter((id) => {
            const selectedLayer = getLayer(id, campaign)
            if (!selectedLayer || selectedLayer.fieldCampaignName !== "LEE") return false
            return (selectedLayer.listingDate || selectedLayer.date) === listingDate
        })

        const dow7Selected = selectedLeeOnDate.some((id) => {
            const selectedLayer = getLayer(id, campaign)
            return selectedLayer?.displayMechanism === "dow7"
        })

        let flyOnLoad = isLeeWideAreaLayer(layer)
            ? shouldLeeWideAreaLayerFlyOnLoad(layer, this.activeLayers, selectedLayerId)
            : shouldLeeRegionalLayerFlyOnLoad(layer, this.activeLayers, selectedLayerId)

        if (dow7Selected && layer.displayMechanism !== "dow7") {
            flyOnLoad = false
        }

        const inProgressLeeOnDate = (store.getState().layerStatus?.inProgress || []).filter(
            (id) => {
                if (id === selectedLayerId) return false
                const loadingLayer = getLayer(id, campaign)
                if (!loadingLayer || loadingLayer.fieldCampaignName !== "LEE") return false
                return (loadingLayer.listingDate || loadingLayer.date) === listingDate
            }
        )

        if (inProgressLeeOnDate.length > 0 && flyOnLoad) {
            flyOnLoad = false
        }

        if (layer.displayMechanism === "dow7") {
            const isOnlySelectedLeeOnDate =
                selectedLeeOnDate.length === 1 && selectedLeeOnDate[0] === selectedLayerId
            if (isOnlySelectedLeeOnDate) {
                flyOnLoad = true
            } else if (this.activeLayers.length > 0) {
                flyOnLoad = false
            }
        }

        const options = {
            flyOnLoad,
            visibilityBoost:
                selectedLeeOnDate.length > 1 ||
                layer.displayMechanism === "dow7" ||
                dow7Selected,
        }
        if (dow7Selected && layer.displayMechanism === "nexrad") {
            options.imageryAlpha = 0.5
        }
        if (dow7Selected && layer.displayMechanism === "lma3dtile") {
            options.pointSize = 2.5
        }
        if (isLeeWideAreaLayer(layer) && flyOnLoad) {
            options.continentalCamera = LEE_GLM_CONTINENTAL_CAMERA
        }

        const sharedLeeClock =
            selectedLeeOnDate.length > 1 ||
            this.activeLayers.some((entry) => {
                const activeLayer = entry?.layer
                return (
                    activeLayer?.fieldCampaignName === "LEE" &&
                    (activeLayer.listingDate || activeLayer.date) === listingDate &&
                    activeLayer.layerId !== selectedLayerId
                )
            })

        if (sharedLeeClock) {
            options.skipViewerClock = true
            options.sharedLeeClock = true
        }

        return options
    }

    removeStaleViewerEntry(layer, result) {
        const cesiumLayerRef = result?.cesiumLayerRef
        if (!cesiumLayerRef || viewer.isDestroyed?.()) return

        if (layer.displayMechanism === "czml") {
            viewer.dataSources.remove(cesiumLayerRef)
        } else if (layer.displayMechanism === "3dtile" || layer.displayMechanism === "points") {
            viewer.scene.primitives.remove(cesiumLayerRef)
        } else if (layer.displayMechanism === "wmts") {
            viewer.imageryLayers.remove(cesiumLayerRef)
        } else if (layer.displayMechanism === "entities") {
            viewer.entities.remove(cesiumLayerRef)
        }
    }

    commitLayerLoad(selectedLayerId, layer, result, unloadFn, refsKey) {
        if (!result) {
            store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
            return null
        }

        const refs = refsKey ? result[refsKey] : null
        if (!this.isLayerSelected(selectedLayerId)) {
            if (unloadFn) {
                this.abandonStaleLayerLoad(selectedLayerId, unloadFn, refs)
            } else {
                this.removeStaleViewerEntry(layer, result)
                store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
            }
            return null
        }

        const activeEntry = {
            layer,
            cesiumLayerRef: result.cesiumLayerRef,
        }
        if (refsKey) {
            activeEntry[refsKey] = refs
        }

        this.activeLayers.push(activeEntry)
        store.dispatch(allActions.listActions.markLoaded(selectedLayerId))

        if (this.activeLayers.length > 1) {
            syncDow7MultiLayerVisibility(viewer, this.activeLayers)
        }

        return result.cesiumLayerRef
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
            const removingLayer = layersToRemove[i].layer
            if (removingLayer.displayMechanism === "nexrad") {
                abortNexradLayerLoad(removingLayer.layerId, viewer)
            } else {
                cancelLayerLoad(removingLayer.layerId)
            }
            if (removingLayer.displayMechanism === "czml") {
                viewer.dataSources.remove(layersToRemove[i].cesiumLayerRef)
            } else if (layersToRemove[i].layer.displayMechanism === "dow7") {
                unloadDow7Layer(viewer, layersToRemove[i].dow7Refs)
            } else if (layersToRemove[i].layer.displayMechanism === "lma3dtile") {
                unloadLma3dtileLayer(viewer, layersToRemove[i].lma3dtileRefs)
            } else if (layersToRemove[i].layer.displayMechanism === "soundingCzml") {
                unloadSoundingCzmlLayer(viewer, layersToRemove[i].soundingCzmlRefs)
            } else if (layersToRemove[i].layer.displayMechanism === "efm") {
                unloadEfmLayer(viewer, layersToRemove[i].efmRefs)
            } else if (removingLayer.displayMechanism === "nexrad") {
                unloadNexradLayer(viewer, layersToRemove[i].nexradRefs)
            } else if (layersToRemove[i].layer.displayMechanism === "glm") {
                unloadGlmLayer(viewer, layersToRemove[i].glmRefs)
            } else if (layersToRemove[i].layer.displayMechanism === "3dtile" || layersToRemove[i].layer.displayMechanism === "points") {
                viewer.scene.primitives.remove(layersToRemove[i].cesiumLayerRef)
                if (layersToRemove[i].eventCallback) {
                    layersToRemove[i].eventCallback()
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

        const { inProgress } = store.getState().layerStatus
        for (const layerId of inProgress) {
            if (!this.isLayerSelected(layerId, selectedLayers)) {
                const layer = getLayer(layerId, campaign)
                if (layer?.displayMechanism === "nexrad") {
                    abortNexradLayerLoad(layerId, viewer)
                } else {
                    cancelLayerLoad(layerId)
                }
                store.dispatch(allActions.listActions.markUnLoaded(layerId))
            }
        }

        /** For the remainder of the selected layers, iterate over it and visualize in cesium viewer. **/
        const activeLayerCountBeforeBatch = this.activeLayers.length
        const batchLoadMechanisms = []

        for (const [, selectedLayerId] of selectedLayers.entries()) {
            const layer = getLayer(selectedLayerId, campaign)
            if (!layer) {
                console.warn(`Skipping unknown layer id: ${selectedLayerId}`)
                store.dispatch(allActions.listActions.removeLayerId(selectedLayerId))
                continue
            }

            const layerDate = moment.utc(layer.listingDate || layer.date).format("YYYY-MM-DD")
            const cesiumDate = JulianDate.toDate(viewer.clock.currentTime)
            const viewerDate = moment.utc(cesiumDate).format("YYYY-MM-DD")
            const viewerClockMs = cesiumDate.getTime()
            const clockInLayerWindow =
                layer.start &&
                layer.end &&
                viewerClockMs >= Date.parse(layer.start) &&
                viewerClockMs <= Date.parse(layer.end)
            const datesMatch =
                viewerDateMatchesLayer(layer, viewerDate) || clockInLayerWindow

            if (!datesMatch) {
                // i.e. when layers is getting changed (currentLayerDate vs OldLayerDate)
                this.layerChanged = true; // FOR CAMERA INITIAL POSITION
                // reset the layer render promise list
                layersRenderPromises.length = 0;
                // Keep only layers for this listing date; drop other IOP days from selection.
                setTimeout(() => {
                    if(!checkPath()) return;
                    store.dispatch(allActions.listActions.removeLayersByDate(layerDate))
                }, 1000)

                if (layer.start) {
                    viewer.clock.currentTime = JulianDate.fromIso8601(layer.start)
                }

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

            const { inProgress: loadingLayerIds } = store.getState().layerStatus
            if (loadingLayerIds.includes(selectedLayerId)) continue

            startLayerLoad(selectedLayerId)
            store.dispatch(allActions.listActions.markLoading(selectedLayerId))

            if (layer.displayMechanism === "czml") {
                let czmlPromise = this.handleCZML(layer, selectedLayerId);
                layersRenderPromises.push(czmlPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "dow7") {
                let dow7Promise = this.handleDow7(layer, selectedLayerId);
                layersRenderPromises.push(dow7Promise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "lma3dtile") {
                let lmaPromise = this.handleLma3dtile(layer, selectedLayerId);
                layersRenderPromises.push(lmaPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "soundingCzml") {
                let soundingPromise = this.handleSoundingCzml(layer, selectedLayerId);
                layersRenderPromises.push(soundingPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "efm") {
                let efmPromise = this.handleEfm(layer, selectedLayerId);
                layersRenderPromises.push(efmPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "nexrad") {
                let nexradPromise = this.handleNexrad(layer, selectedLayerId);
                layersRenderPromises.push(nexradPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "glm") {
                let glmPromise = this.handleGlm(layer, selectedLayerId);
                layersRenderPromises.push(glmPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            } else if (layer.displayMechanism === "3dtile") {
                let tilePromise = this.handle3dTiles(layer, selectedLayerId);
                layersRenderPromises.push(tilePromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            }
            else if (layer.displayMechanism === "points") {
                let pointPrimitivePromise = this.handlePointPrimitive(layer, selectedLayerId);
                layersRenderPromises.push(pointPrimitivePromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            }
            else if (layer.displayMechanism === "wmts") {
                let wmtsPromise = this.handleWMTS(layer, selectedLayerId);
                layersRenderPromises.push(wmtsPromise);
                batchLoadMechanisms.push(layer.displayMechanism);
            }
        }

        // Only reset timeline/camera when new layers actually finished loading.
        if (layersRenderPromises.length > 0) {
            const addedOnlyDow7 =
                batchLoadMechanisms.length === 1 &&
                batchLoadMechanisms[0] === "dow7" &&
                activeLayerCountBeforeBatch > 0

            Promise.all(layersRenderPromises).then(() => {
                const pactiveLayer = this.extractPrioritizedLayer(this.activeLayers)
                if (!pactiveLayer) return
                this.prioritizedTimelineZoom(pactiveLayer, campaign)

                const shouldFrameCamera =
                    !addedOnlyDow7 &&
                    (this.layerChanged ||
                        shouldUseLeeMultiInstrumentCamera(this.activeLayers) ||
                        (batchLoadMechanisms.length === 1 && batchLoadMechanisms[0] === "dow7"))

                if (shouldFrameCamera) {
                    this.prioritizedCameraPosition(pactiveLayer, this.activeLayers, campaign)
                }

                if (!addedOnlyDow7 && shouldUseLeeMultiInstrumentCamera(this.activeLayers)) {
                    syncDow7MultiLayerVisibility(viewer, this.activeLayers, { flyToView: true })
                    ;[800, 2000, 4000].forEach((delayMs) => {
                        setTimeout(() => {
                            syncDow7MultiLayerVisibility(viewer, this.activeLayers, { flyToView: true })
                        }, delayMs)
                    })
                } else {
                    syncDow7MultiLayerVisibility(viewer, this.activeLayers)
                    setTimeout(() => {
                        syncDow7MultiLayerVisibility(viewer, this.activeLayers)
                    }, 1500)
                }
            }).catch(error => console.error(error))
        }
    }

    // visualization handlers for different visualization types START

    handleDow7(layer, selectedLayerId) {
        const activeViewer = getViewer()
        if (!activeViewer) {
            console.warn("DOW7: Cesium viewer not ready yet")
            store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
            return Promise.resolve(null)
        }

        const leeOptions = this.getLeeLoadOptions(layer, selectedLayerId)
        return loadDow7Layer(activeViewer, layer, leeOptions)
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadDow7Layer, "dow7Refs"))
            .catch((error) => {
                console.error("Error loading DOW7:", error)
                store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                window.alert(
                    `Error loading DOW7. ${error?.message || "Check the browser console for details."}`
                )
                this.errorLayers.push(selectedLayerId)
                return null
            })
    }

    handleLma3dtile(layer, selectedLayerId) {
        const leeOptions = this.getLeeLoadOptions(layer, selectedLayerId)
        return loadLma3dtileLayer(viewer, layer, leeOptions)
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadLma3dtileLayer, "lma3dtileRefs"))
            .catch((error) => {
                console.error(error)
                window.alert("Error Loading LMA Data")
                this.errorLayers.push(selectedLayerId)
                throw error
            })
    }

    handleSoundingCzml(layer, selectedLayerId) {
        const leeOptions = this.getLeeLoadOptions(layer, selectedLayerId)
        return loadSoundingCzmlLayer(viewer, layer, leeOptions)
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadSoundingCzmlLayer, "soundingCzmlRefs"))
            .catch((error) => {
                const triedUrls = [
                    ...(layer.czmlLocations || []),
                    layer.czmlLocation,
                    ...(layer.czmlAlternates || []),
                ].filter(Boolean)
                console.error(`Error loading ${layer.displayName}. Tried URLs:`, triedUrls, error)
                window.alert(`Error Loading ${layer.displayName}. Check console for URL details.`)
                this.errorLayers.push(selectedLayerId)
                throw error
            })
    }

    handleEfm(layer, selectedLayerId) {
        const leeOptions = this.getLeeLoadOptions(layer, selectedLayerId)
        return loadEfmLayer(viewer, layer, leeOptions)
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadEfmLayer, "efmRefs"))
            .catch((error) => {
                console.error(`Error loading ${layer.displayName}:`, error)
                window.alert(`Error Loading ${layer.displayName}. Check console for URL details.`)
                this.errorLayers.push(selectedLayerId)
                throw error
            })
    }

    handleNexrad(layer, selectedLayerId) {
        const staleNexradIds = unloadAllNexradLayers(viewer, this.activeLayers)
        staleNexradIds.forEach((layerId) => {
            store.dispatch(allActions.listActions.markUnLoaded(layerId))
        })
        this.activeLayers = this.activeLayers.filter(
            (entry) => entry.layer.displayMechanism !== "nexrad"
        )

        return loadNexradLayer(viewer, layer, this.getLeeLoadOptions(layer, selectedLayerId))
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadNexradLayer, "nexradRefs"))
            .catch((error) => {
                console.error(`Error loading ${layer.displayName}:`, error)
                window.alert(`Error Loading ${layer.displayName}. Check console for URL details.`)
                this.errorLayers.push(selectedLayerId)
                throw error
            })
    }

    handleGlm(layer, selectedLayerId) {
        const leeOptions = this.getLeeLoadOptions(layer, selectedLayerId)
        return loadGlmLayer(viewer, layer, leeOptions)
            .then((result) => this.commitLayerLoad(selectedLayerId, layer, result, unloadGlmLayer, "glmRefs"))
            .catch((error) => {
                console.error(`Error loading ${layer.displayName}:`, error)
                store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                store.dispatch(allActions.listActions.handleToggle(selectedLayerId))
                this.errorLayers.push(selectedLayerId)
                throw error
            })
    }

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
                const stillSelected = this.isLayerSelected(selectedLayerId) &&
                    this.activeLayers.some((item) => item.layer.layerId === selectedLayerId)
                if (!stillSelected) {
                    viewer.scene.primitives.remove(newTileset)
                    this.activeLayers = this.activeLayers.filter(
                        (item) => item.layer.layerId !== selectedLayerId
                    )
                    store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                    resolve(null)
                    return
                }

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
                } else if (layer.displayName === "DROPSONDE") {
                    // tileset.style.color = getColorExpression();
                    tileset.style.color = 'mix(color("red"), color("red"), -1*${value})';
                    tileset.style.pointSize = 5.0;
                    // add pin to visualize the skewT
                    //location
                    setTimeout(() => {
                        let ds = viewer && viewer.dataSources.getByName("wall czml")[0]; // make it unique for cpex
                        let entity = ds && ds.entities.getById("Flight Track");
                        if (entity) {
                            let timeOfDrop = JulianDate.fromIso8601(tileset.properties.epoch);
                            JulianDate.addSeconds(timeOfDrop, -10, timeOfDrop);
                            let positionProperty = entity.position;
                            const position = positionProperty.getValue(timeOfDrop)
                            // Instead, getting position directly from the 3dtile json would be much faster.
                            // If critical information could be added directly to the json header, when the 3d tile is created.

                            // add pin
                            let date = tileset.properties.epoch.split("T")[0]
                            let parsedDate = date.replace(/-/g,'');
                            const pinBuilder = new PinBuilder();
                            let pin = viewer.entities.add({
                                name: `cpexawDropsonde-${parsedDate}`,
                                position: position,
                                billboard: {
                                image: pinBuilder.fromColor(Color.ROYALBLUE, 48).toDataURL(),
                                verticalOrigin: VerticalOrigin.BOTTOM,
                                },
                            });
                            this.activeLayers.push({ layer: {...layer, displayMechanism: "entities"}, cesiumLayerRef: pin })
                            // add event handler
                            viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
                                if (defined(selectedEntity) && defined(selectedEntity.name) && selectedEntity.name.includes('cpexawDropsonde')) {
                                    let date = selectedEntity.name.split("-")[1];
                                    let url = `${newFieldCampaignsBaseUrl}/CPEX-AW/instrument-processed-data/dropsonde/skewT/${date}/dropsonde.png`;
                                    this.setImageViewerState(true, url);
                                }
                            });
                        }
                    }, 1000);
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
        // eslint-disable-next-line no-loop-func
        return new Promise((resolve, reject) => {
            dataSource.load(layer.czmlLocation).then((ds) => {
                if (!this.isLayerSelected(selectedLayerId)) {
                    viewer.dataSources.remove(ds)
                    store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                    resolve(null)
                    return
                }

                store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
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
                    this.trackedEntity = dataSource.entities.getById("Flight Track") // entity to be tracked.
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
        const intvl = 60;
        const promiseG = Promise.resolve(loadData(layer.tileLocation));
        return new Promise((resolve, reject) => {
            Promise.all([promiseG]).then(([LightningData]) => {
                if (!this.isLayerSelected(selectedLayerId)) {
                    store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                    resolve(null)
                    return
                }

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
                if (!this.isLayerSelected(selectedLayerId)) {
                    viewer.imageryLayers.remove(imageLayer)
                    this.activeLayers = this.activeLayers.filter(
                        (item) => item.layer.layerId !== selectedLayerId
                    )
                    store.dispatch(allActions.listActions.markUnLoaded(selectedLayerId))
                    resolve(null)
                    return
                }

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
        if (!activeLayers?.length) {
            return null
        }
        if (activeLayers.length === 1) {
            return activeLayers[0];
        }
        let priorityEnum = {
            'dow7': 0,
            'lma3dtile': 0,
            '3dtile': 0,
            'nexrad': 0,
            'soundingCzml': 1,
            'efm': 1,
            'czml': 1,
            'points': 2,
            'glm': 2,
            'entities': 3,
            'wmts': 4
        }
        activeLayers.sort((el1, el2) => {
            // if return -ve, pushed to back
            // if returned +ve, pushed to front
            let order1 = priorityEnum[el1.layer.displayMechanism]
            let order2 = priorityEnum[el2.layer.displayMechanism]
            if (el1.layer.useCzmlClock) order1 = -1
            if (el2.layer.useCzmlClock) order2 = -1
            if (order1 === undefined) return -1;
            if (order2 === undefined) return 1;
            if (order1 === order2) {
                const date1 = el1.layer.listingDate || el1.layer.date || ""
                const date2 = el2.layer.listingDate || el2.layer.date || ""
                if (date1 !== date2) {
                    return date1 < date2 ? 1 : -1
                }
            }
            return order1 - order2;
        });
        return activeLayers[0];
    }

    pickActiveNexradLayer = (activeLayers) => {
        const nexradLayers = (activeLayers || []).filter(
            (entry) =>
                entry?.layer?.displayMechanism === "nexrad" &&
                entry?.nexradRefs?.framesMeta?.length
        )
        if (!nexradLayers.length) return null

        return nexradLayers.sort((a, b) => {
            const dateA = a.layer.listingDate || a.layer.date || ""
            const dateB = b.layer.listingDate || b.layer.date || ""
            if (dateA === dateB) return 0
            return dateA < dateB ? -1 : 1
        })[nexradLayers.length - 1]
    }

    prioritizedTimelineZoom = (layer, campaign) => {
        if (!layer?.layer) return

        const layerMeta = layer.layer
        const listingDate = layerMeta.listingDate || layerMeta.date

        if (layerMeta.fieldCampaignName === "LEE" && listingDate) {
            const leeOnDate = pickLeeLayersOnListingDate(this.activeLayers, listingDate)
            if (leeOnDate.length >= 2) {
                applyCombinedLeeLayersClock(viewer, this.activeLayers, listingDate)
                syncLeeInstrumentsAtViewerTime(viewer, this.activeLayers)
                registerLeeInstrumentClockSync(
                    viewer,
                    () => this.activeLayers,
                    this.leeClockSync
                )
                return
            }
        }

        if (layerMeta.fieldCampaignName === "LEE" && listingDate) {
            if (shouldUseLeeDatasetClock(this.activeLayers, listingDate)) {
                applyCombinedLeeLayersClock(viewer, this.activeLayers, listingDate)
                syncLeeInstrumentsAtViewerTime(viewer, this.activeLayers)
                unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
                return
            }
        }

        unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)

        const activeNexrad = this.pickActiveNexradLayer(this.activeLayers)
        if (activeNexrad) {
            unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
            applyNexradViewerClock(viewer, activeNexrad.layer, activeNexrad.nexradRefs)
            return
        }

        if (layerMeta.displayMechanism === "efm" && layer.efmRefs) {
            unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
            applyEfmViewerClock(viewer, layerMeta, layer.efmRefs);
            return;
        }

        if (layerMeta.displayMechanism === "nexrad" && layer.nexradRefs) {
            unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
            applyNexradViewerClock(viewer, layerMeta, layer.nexradRefs);
            return;
        }

        if (layerMeta.displayMechanism === "glm" && layer.glmRefs) {
            unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
            applyGlmViewerClock(viewer, layerMeta, layer.glmRefs);
            return;
        }

        if (layerMeta.useCzmlClock && applySoundingCzmlClockToViewer(viewer, layer)) {
            unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)
            return;
        }

        unregisterLeeInstrumentClockSync(viewer, this.leeClockSync)

        // get start datetime from that layer
        const layerStartDateTime = extractLayerStartDatetime(layer, campaign);
        const date = extractLayerDate(layer);
        const campaignStartDateTime = layerMeta.start || `${date}T00:00:00Z`;
        const campaignEndDateTime =
            layerMeta.end ||
            (layerMeta.fieldCampaignName === "LEE" && layerMeta.throughDate
                ? `${layerMeta.throughDate}T23:59:59Z`
                : `${date}T23:59:59Z`);
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
        if (layerMeta.clockMultiplier) {
            viewer.clock.multiplier = layerMeta.clockMultiplier;
        }
        viewer.clock.shouldAnimate = true;
        viewer.timeline.zoomTo(JulianDate.fromIso8601(campaignStartDateTime), JulianDate.fromIso8601(campaignEndDateTime));
    }

    prioritizedCameraPosition = (prioritizedActiveLayer, activeLayers, campaign) => {
        if (!prioritizedActiveLayer?.layer || !activeLayers?.length) {
            return
        }

        if (shouldUseLeeMultiInstrumentCamera(activeLayers)) {
            flyToLeeCamera(viewer, getLeeMultiInstrumentCamera(activeLayers))
            return
        }

        if (shouldUseLeeWideAreaCamera(activeLayers)) {
            flyToLeeCamera(viewer, LEE_GLM_CONTINENTAL_CAMERA)
            return
        }

        if (
            prioritizedActiveLayer?.layer?.displayMechanism === "efm" ||
            prioritizedActiveLayer?.layer?.displayMechanism === "nexrad"
        ) {
            return;
        }

        let useFlightNavForCameraPosition =  false;
        let flightLayerObject = null;
        // if the campaign meta has a hardcoded inline camera position for a given date, use that
        let layerDate = moment(activeLayers[0].layer.date).format("YYYY-MM-DD")
        if (campaign.defaultCamera && campaign.defaultCamera[layerDate] && campaign.defaultCamera[layerDate].position) {
            // if desired camera position availabe in layer meta, use that.
            this.restoreCamera(campaign.defaultCamera[layerDate]);
            return;
        }
        // else set the camera position using the flight track czml position, if flight track available.
        for (const [idx, layerObject] of activeLayers.entries()) {
            const {layer} = layerObject;
            // based on airflight location, place the camera.
            // If layer display type czml, then use its position to set the camera default position.
            if (layer.displayMechanism === "czml" && layer.type === "track") {
               useFlightNavForCameraPosition = true;
               flightLayerObject = layerObject;
            }
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
        if (prioritizedActiveLayer.layer.displayMechanism === "dow7") {
            const { cesiumLayerRef: tileset } = prioritizedActiveLayer
            if (tileset) {
                try {
                    viewer.zoomTo(tileset)
                    return
                } catch (err) {
                    console.warn("DOW7 zoomTo tileset failed, using center fallback:", err)
                }
            }

            const center = prioritizedActiveLayer.layer.center
            if (center) {
                const cameraHeight = Math.max(center.radius * 2.8, 170000)
                viewer.camera.flyTo({
                    destination: Cartesian3.fromDegrees(center.lon, center.lat, cameraHeight),
                    orientation: {
                        heading: cMath.toRadians(0),
                        pitch: cMath.toRadians(-90),
                        roll: 0,
                    },
                    duration: 1.5,
                })
            }
            return
        }
        if (prioritizedActiveLayer.layer.displayMechanism === "lma3dtile") {
            const {cesiumLayerRef: tileset} = prioritizedActiveLayer;
            viewer.zoomTo(tileset);
            return;
        }
        if (prioritizedActiveLayer.layer.displayMechanism === "3dtile" ) {
            const {cesiumLayerRef: tileset} = prioritizedActiveLayer;
            viewer.zoomTo(tileset);
            return;
        }

        if (shouldUseLeeRegionalCamera(activeLayers)) {
            flyToLeeCamera(viewer, LEE_REGIONAL_CAMERA)
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

    // Utils END

    componentDidMount() {
        /** Fetch the campaign **/
        const campaign = (() => this.props.campaign)()

        const bootstrapViewer = (attempt = 0) => {
            const activeViewer = getViewer()
            if (!activeViewer) {
                if (attempt < 80) {
                    setTimeout(() => bootstrapViewer(attempt + 1), 250)
                    return
                }
                alert(`Error: Viewer failed to initialize. Please contact support team at ${supportEmail}`)
                return
            }

            if (this.viewerBootstrapped) return
            this.viewerBootstrapped = true

            if (isEmpty(campaign)) {
                alert(`Error: Couldn't fetch the data. Please contact support team at ${supportEmail}`)
            }

            activeViewer.scene.globe.tileLoadProgressEvent.addEventListener((_tiles) => { })

            activeViewer.imageryLayers.layerAdded.addEventListener((layer) => {
                if (layer.imageryProvider) {
                    // we can raise an event here for imagery ${layer.imageryProvider.url} loaded
                }
            })

            /** Set Viewer clock settings **/

            activeViewer.clock.clockRange = ClockRange.LOOP_STOP
            activeViewer.clock.multiplier = 10

            if (this.isLeeDow7Selected(campaign)) {
                flyToDow7InitialView(activeViewer)
            }

            /** Save the camera instance, after camera is set in viewer **/

            setInterval(() => {
                let camera = activeViewer.scene.camera
                this.savedSamera = {
                    position: camera.position,
                    direction: camera.direction,
                    up: camera.up,
                    right: camera.right,
                    currentTime: activeViewer.clock.currentTime,
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
                    const v = getViewer()
                    if (!v) return
                    let entitiesLength = v.entities.values.length
                    let dataSourcesLength = v.dataSources.length
                    let primitiesLength = v.scene.primitives.length
                    if (entitiesLength === 0 && dataSourcesLength === 0 && primitiesLength === 0) {
                        this.activeLayers = []
                        if (this.lastSelectedLayers.length !== 0) {
                            if (this.isLeeDow7Selected(campaign, this.lastSelectedLayers)) {
                                flyToDow7InitialView(v)
                            }
                            this.renderLayers(this.lastSelectedLayers, campaign)
                            if (!this.isLeeDow7Selected(campaign, this.lastSelectedLayers)) {
                                this.restoreCamera(this.savedSamera)
                            }
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
                    activeViewer.trackedEntity = this.trackedEntity
                    activeViewer.clock.shouldAnimate = true
                    activeViewer.clock.canAnimate = true
                } else {
                    this.trackEntity = false
                    activeViewer.trackedEntity = null
                }
            })

            emitter.on("listcheck", (selectedLayers) => {
                this.lastSelectedLayers = selectedLayers
                this.renderLayers(selectedLayers, campaign)
            })

            /** Adjust the height of dock where cesium is displayed. **/

            adjustHeightOfPanels()

            setTimeout(() => {
                adjustHeightOfPanels()
            }, 1000)
        }

        emitter.on("cesiumViewerReady", () => bootstrapViewer())
        bootstrapViewer()

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
