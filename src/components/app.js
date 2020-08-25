import React, { Component } from "react"
import { hot } from "react-hot-loader"
import Snackbar from "@material-ui/core/Snackbar"
import Alert from "@material-ui/lab/Alert"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
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
} from "cesium"
import { extendCesium3DTileset } from "temporal-3d-tile"
import emitter from "../helpers/event"
import campaign from "../layers"
import { Dock, viewer } from "./dock"
import store from "../state/store"
import allActions from "../state/actions"
import { getLayer, adjustHeightOfPanels, getGPUInfo } from "../helpers/utils"
import { supportEmail } from "../config"

let epoch
let viewerTime = 0
let lead = 0
let linger = 300
let reverse = true
let ascale = 4.346
let vmin = -10
let vmax = 30
let vrange = vmax - vmin
let hmin = 0.438
let hrange = 1
let activeLayers = []
let lastSelectedLayers = []
let savedSamera
let trackEntity = false
let trackedEntity

const Temporal3DTileset = extendCesium3DTileset({ Cesium3DTileset, Cesium3DTile, Cesium3DTileOptimizations, Cesium3DTileRefine, CullingVolume, RuntimeError, TimeInterval, defined })

let getColorExpression = () => {
  let revScale = ""
  if (reverse) {
    revScale = " * -1.0 + 1.0"
  }
  return `hsla((((clamp(\${value}, ${vmin}, ${vmax}) + ${vmin}) / ${vrange}) ${revScale}) * ${hrange} + ${hmin}, 1.0, 0.5, pow((\${value} - ${vmin})/${vrange}, ${ascale}))`
}

let getShowExpression = () => {
  return `\${time} <= ${viewerTime + lead} && \${time} >= ${viewerTime - linger}`
}

function renderLayers(selectedLayers) {
  const layersToRemove = []
  for (const [, activeLayerItem] of activeLayers.entries()) {
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
  for (let i = 0; i < layersToRemove.length; i++) {
    if (layersToRemove[i].layer.displayMechanism === "czml") {
      viewer.dataSources.remove(layersToRemove[i].cesiumLayerRef)
    } else if (layersToRemove[i].layer.displayMechanism === "3dtile") {
      viewer.scene.primitives.remove(layersToRemove[i].cesiumLayerRef)
      if (layersToRemove[i].eventCallback) {
        layersToRemove[i].eventCallback()
      }
    } else if (layersToRemove[i].layer.displayMechanism === "wmts") {
      viewer.imageryLayers.remove(layersToRemove[i].cesiumLayerRef)
    }

    store.dispatch(allActions.listActions.markUnLoaded(layersToRemove[i].layer.layerId))

    activeLayers = activeLayers.filter((item) => {
      return item.layer.layerId !== layersToRemove[i].layer.layerId
    })
  }

  for (const [, selectedLayerId] of selectedLayers.entries()) {
    const layer = getLayer(selectedLayerId)

    const layerDate = moment(layer.date).format("YYYY-MM-DD") //todo change to moment.utc?
    const cesiumDate = JulianDate.toDate(viewer.clock.currentTime)
    const viewerDate = moment.utc(cesiumDate).format("YYYY-MM-DD")
    const viewerStart = `${layerDate}T00:00:00Z`
    const viewerEnd = `${layerDate}T23:59:59Z`

    if (layerDate !== viewerDate) {
      // remove layers with other dates
      setTimeout(function () {
        store.dispatch(allActions.listActions.removeLayersByDate(viewerDate))
      }, 1000)

      viewer.clock.currentTime = JulianDate.fromIso8601(viewerStart)

      if (campaign.defaultCamera[layerDate] && campaign.defaultCamera[layerDate].position) {
        restoreCamera(campaign.defaultCamera[layerDate])
      }
    }
    viewer.clock.startTime = JulianDate.fromIso8601(viewerStart)
    viewer.clock.stopTime = JulianDate.fromIso8601(viewerEnd)
    viewer.timeline.zoomTo(JulianDate.fromIso8601(viewerStart), JulianDate.fromIso8601(viewerEnd))

    let found = false
    for (const [, activeLayerItem] of activeLayers.entries()) {
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
          let modelReference = ds.entities.getById("Flight Track")

          modelReference.orientation = new CallbackProperty((time, result) => {
            const position = modelReference.position.getValue(time)
            const roll = modelReference.properties.roll.getValue(time)
            const pitch = modelReference.properties.pitch.getValue(time)
            const heading = modelReference.properties.heading.getValue(time)
            const hpr = new HeadingPitchRoll(heading, pitch, roll)
            return Transforms.headingPitchRollQuaternion(position, hpr)
          }, false)

          trackedEntity = ds.entities.getById("Flight Track")
          trackedEntity.viewFrom = new Cartesian3(-30000, -70000, 50000)
          if (trackEntity) {
            viewer.trackedEntity = trackedEntity
            viewer.clock.shouldAnimate = true
            viewer.clock.canAnimate = true
          }
        }

        activeLayers.push({ layer: layer, cesiumLayerRef: ds })
        viewer.dataSources.add(ds)
      })
    } else if (layer.displayMechanism === "3dtile") {
      //use TimeDynamicPointCloud from Brian's npm package temporal-3d-tile
      const newTileset = new Temporal3DTileset({
        url: layer.tileLocation,
        layerId: layer.layerId, // currently not used
      })
      activeLayers.push({ layer: layer, cesiumLayerRef: newTileset })

      viewer.scene.primitives.add(newTileset)

      let previousTime = JulianDate.clone(viewer.clock.currentTime)

      newTileset.readyPromise
        // eslint-disable-next-line no-loop-func
        .then((tileset) => {
          store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
          epoch = JulianDate.fromIso8601(tileset.properties.epoch)
          tileset.style = new Cesium3DTileStyle()
          tileset.style.pointSize = 2.0
          tileset.style.color = getColorExpression()
          viewerTime = JulianDate.secondsDifference(JulianDate.clone(viewer.clock.currentTime), epoch)
          tileset.style.show = getShowExpression(viewerTime)
          tileset.makeStyleDirty()

          emitter.on("lingerTimeChange", (value) => {
            linger = value
            tileset.style.show = getShowExpression(viewerTime)
            tileset.makeStyleDirty()
          })

          if (layer.addOnTickEventListener && layer.addOnTickEventListener === true) {
            const eventCallback = viewer.clock.onTick.addEventListener((e) => {
              if (!JulianDate.equalsEpsilon(previousTime, viewer.clock.currentTime, 1)) {
                previousTime = JulianDate.clone(viewer.clock.currentTime)
                viewerTime = JulianDate.secondsDifference(previousTime, epoch)
                tileset.style.show = getShowExpression()
                tileset.makeStyleDirty()
              }
            })

            for (const [, activeLayerItem] of activeLayers.entries()) {
              if (activeLayerItem.layer.layerId === layer.layerId) {
                activeLayerItem.eventCallback = eventCallback
                break
              }
            }
          }
        })
        .otherwise(function (error) {
          window.alert(error)
        })
    } else if (layer.displayMechanism === "wmts") {
      const times = layer.times
      const dates = []
      for (const time of times) {
        const date = new JulianDate()
        JulianDate.addSeconds(JulianDate.fromIso8601("2000-01-01T12:00:00Z"), Number(time), date)
        dates.push(date)
      }
      const timeIntervalCollection = TimeIntervalCollection.fromJulianDateArray({
        julianDates: dates,
        dataCallback: (interval, index) => {
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

      activeLayers.push({ layer: layer, cesiumLayerRef: imageLayer })

      imageryProvider.readyPromise.then((status) => {
        if (status) {
          store.dispatch(allActions.listActions.markLoaded(selectedLayerId))
        }
      })
    }
  }
}

function readStateAndRender() {
  const selectedLayers = store.getState().selectedLayers
  if (JSON.stringify(lastSelectedLayers) !== JSON.stringify(selectedLayers)) {
    lastSelectedLayers = selectedLayers
    renderLayers(selectedLayers)
  }
}

function restoreCamera(cameraObj, updateTime = true) {
  if (cameraObj) {
    let camera = viewer.scene.camera
    camera.position = cameraObj.position
    camera.direction = cameraObj.direction
    camera.up = cameraObj.up
    camera.right = cameraObj.right
    if (updateTime && cameraObj.currentTime) {
      viewer.clock.currentTime = cameraObj.currentTime
    }
  }
}

class App extends Component {
  componentDidMount() {
    if (!viewer) {
      alert(`Error: Viewer failed to initialize. Please contact support team at ${supportEmail}`)
    }

    viewer.scene.globe.tileLoadProgressEvent.addEventListener(function (tiles) {})

    viewer.imageryLayers.layerAdded.addEventListener((layer) => {
      if (layer.imageryProvider) {
        // we can raise an event here for imagery ${layer.imageryProvider.url} loaded
      }
    })

    viewer.clock.clockRange = ClockRange.LOOP_STOP
    viewer.clock.multiplier = 10

    setInterval(function () {
      let camera = viewer.scene.camera
      savedSamera = {
        position: camera.position,
        direction: camera.direction,
        up: camera.up,
        right: camera.right,
        currentTime: viewer.clock.currentTime,
      }
      console.log("saving camera")
    }, 2000)

    //check for default selected layers
    readStateAndRender()

    store.subscribe(() => {
      readStateAndRender()
    })

    emitter.on("dockRender", () => {
      setTimeout(function () {
        let entitiesLength = viewer.entities.values.length
        let dataSourcesLength = viewer.dataSources.length
        let primitiesLength = viewer.scene.primitives.length
        if (entitiesLength === 0 && dataSourcesLength === 0 && primitiesLength === 0) {
          activeLayers = []
          if (lastSelectedLayers.length !== 0) {
            renderLayers(lastSelectedLayers)
            restoreCamera(savedSamera)
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
        trackEntity = true
        viewer.trackedEntity = trackedEntity
        viewer.clock.shouldAnimate = true
        viewer.clock.canAnimate = true
      } else {
        trackEntity = false
        viewer.trackedEntity = null
      }
    })

    emitter.on("listcheck", (selectedLayers) => {
      lastSelectedLayers = selectedLayers
      renderLayers(selectedLayers)
    })

    adjustHeightOfPanels()

    setTimeout(() => {
      adjustHeightOfPanels()
    }, 5000)

    setTimeout(() => {
      let logoElement = document.querySelector(".fcx-logo")
      logoElement.parentNode.removeChild(logoElement)
      let alertElement = document.querySelector("#alert-gpu")
      if (alertElement) {
        alertElement.parentNode.removeChild(alertElement)
      }
    }, 5000)
  }

  render() {
    let gpuInfo = getGPUInfo()

    return (
      <div>
        <Snackbar id="alert-gpu" anchorOrigin={{ vertical: "top", horizontal: "center" }} open={!gpuInfo.discreteGPU} key="alert-gpu">
          <Alert severity="error">Note: Your current GPU is {gpuInfo.gpuName}. The performance of Field Campaign Explorer will depend performance of your GPU. A discrete GPU is recommended.</Alert>
        </Snackbar>

        <div className="fcx-logo animate__rotateIn">
          <Animated animationIn="tada" animationOut="rollOut" animationInDuration={5000} animationOutDuration={1000} isVisible={true}>
            <img alt="FCX Logo" className="centered" src={`${process.env.PUBLIC_URL}/fcx_logo.png`} />
          </Animated>
        </div>

        <AppBar position="fixed" style={{ top: 30 }}>
          <Toolbar>
            <a target="_blank" rel="noopener noreferrer" href="https://nasa.gov/">
              <img alt="NASA Logo" style={{ marginRight: 20, height: 50 }} src={`${process.env.PUBLIC_URL}/nasa_logo.png`} />
            </a>
            <a target="_blank" rel="noopener noreferrer" href="https://ghrc.nsstc.nasa.gov/">
              <img alt="GHRC Logo" style={{ marginRight: 20, height: 50 }} src={`${process.env.PUBLIC_URL}/ghrc_logo.png`} />
            </a>
            <img alt="FCX Logo" style={{ marginRight: 10, height: 50 }} src={`${process.env.PUBLIC_URL}/fcx_logo.png`} />

            <Typography variant="h6" noWrap>
              Field Campaign Explorer
            </Typography>

            <Typography variant="h6" style={{ marginLeft: 20 }}>
              <a target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "none" }} href=" https://ghrc.nsstc.nasa.gov/home/feedback/contact">
                Contact
              </a>
            </Typography>
          </Toolbar>
        </AppBar>

        <Dock />
      </div>
    )
  }
}

export default hot(module)(App)
