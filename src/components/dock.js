import React from "react"
import { DockLayout } from "rc-dock"
/*
import { IonWorldImageryStyle, ProviderViewModel, buildModuleUrl, createWorldImagery } from "cesium"
// eslint-disable-next-line
import { createDefaultImageryProviderViewModels } from "cesium"
*/
import { FiLayers, FiLink2, FiSettings, FiGlobe, FiInfo } from "react-icons/fi"
import { MdFlightTakeoff, MdTimeline } from "react-icons/md"
import FcxTimeline from "./timeline"
import campaign from "../layers"
import LayerList from "./layerList"
import emitter from "../helpers/event"
import DOIList from "./doiList"
import CampaignInfoLinks from "./campaignInfo"
import Settings from "./settings"
import { getGPUInfo } from "../helpers/utils"
import { mapboxUrl, cesiumDefaultAccessToken } from "../config"
import "rc-dock/dist/rc-dock.css"
import "../css/dock.css"

let Cesium = window.Cesium
let viewer
let gpuInfo = getGPUInfo()

/*
  Useful links related to adding additional layers to base layer picker
  https://stackoverflow.com/questions/48291191/adding-mapbox-imagery-to-cesium-baselayerpicker
  https://github.com/CesiumGS/cesium/blob/master/Source/Widgets/BaseLayerPicker/createDefaultImageryProviderViewModels.js
  
  console.log(createDefaultImageryProviderViewModels())
*/

let providerViewModels = []

providerViewModels.push(
  new Cesium.ProviderViewModel({
    name: "Bing Maps Aerial with Labels",
    iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/bingAerialLabels.png"),
    tooltip: "Bing Maps aerial imagery with labels, provided by Cesium ion",
    category: "Cesium ion",
    creationFunction: function () {
      return Cesium.createWorldImagery({
        style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
      })
    },
  })
)

providerViewModels.push(
  new Cesium.ProviderViewModel({
    name: "Mapbox Streets Dark",
    iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/mapboxStreets.png"),
    category: "Mapbox",
    tooltip: "Mapbox Streets Dark",
    creationFunction: function () {
      return new Cesium.UrlTemplateImageryProvider({
        url: mapboxUrl,
      })
    },
  })
)

let campaignTab = {
  title: (
    <div>
      <MdFlightTakeoff /> Campaign{" "}
    </div>
  ),
  content: (
    <div style={{ textAlign: "center" }}>
      <p>
        <img alt="Campaign Logo" style={{ height: "80%", width: "80%" }} src={campaign.logo} />
        <br /> {campaign.description}
      </p>
    </div>
  ),
}

let box = {
  dockbox: {
    mode: "horizontal",

    children: [
      {
        mode: "vertical",

        children: [
          {
            tabs: [
              { ...campaignTab, id: "tabCampaign" },
              {
                title: (
                  <div>
                    <FiInfo /> Links{" "}
                  </div>
                ),
                id: "tabCampaignLinks",
                content: <CampaignInfoLinks />,
              },
            ],
          },
          {
            size: 550,
            tabs: [
              {
                title: (
                  <div>
                    <FiLayers /> Display{" "}
                  </div>
                ),
                id: "tabDisplay",
                content: <LayerList />,
              },
              {
                title: (
                  <div>
                    <FiLink2 /> Data{" "}
                  </div>
                ),
                id: "tabData",
                content: <DOIList />,
              },
              {
                title: (
                  <div>
                    <FiSettings /> Settings{" "}
                  </div>
                ),
                id: "tabSettings",
                content: <Settings />,
              },
            ],
          },
        ],
      },
      {
        size: 1000,
        panelLock: true,
        tabs: [
          {
            title: (
              <div>
                <FiGlobe /> Data Viewer{" "}
              </div>
            ),
            id: "tabCesium",
            content: (
              <div>
                <span className="gpuName">Detected GPU: {gpuInfo.gpuName}</span>
                <div id="cesiumContainer"></div>
              </div>
            ),
          },
          {
            title: (
              <div>
                <MdTimeline /> Timeline{" "}
              </div>
            ),
            id: "tabTimeline",
            content: <FcxTimeline />,
          },
        ],
      },
    ],
  },
}

/* 
  Useful links related to Dock
  https://codesandbox.io/s/0mjo76mnz0?file=/src/styles.css
*/
class Dock extends React.Component {
  componentDidMount() {
    Cesium.Ion.defaultAccessToken = cesiumDefaultAccessToken

    viewer = new Cesium.Viewer("cesiumContainer", {
      //Use Cesium World Terrain
      terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: true,
      skyBox: false,
      automaticallyTrackDataSourceClocks: false,
      navigationHelpButton: true,
      homeButton: false,
      sceneModePicker: true,
      shadows: false,
      infoBox: false,
      imageryProviderViewModels: providerViewModels,
      selectedImageryProviderViewModel: providerViewModels[1],
    })

    if (viewer) {
      console.log("%c Viewer initialization successful", "background: green; color: white; display: block;")
    }
  }
  onDragNewTab = (e) => {}

  onLayoutChange = (newLayout, currentTabId) => {
    emitter.emit("tabLayoutChange")
    this.setState({ layout: newLayout })
  }
  render() {
    emitter.emit("dockRender")
    return (
      <DockLayout
        defaultLayout={box}
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          right: 10,
          bottom: 10,
        }}
        onLayoutChange={this.onLayoutChange}
      />
    )
  }
}

export { Dock, viewer }
