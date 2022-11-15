import React from "react"
import ReactDOM from 'react-dom';

import { DockLayout } from "rc-dock"

import { IonWorldImageryStyle, ProviderViewModel, buildModuleUrl, createWorldImagery, UrlTemplateImageryProvider, Viewer, Ion, Cartesian3, Color, LabelStyle, VerticalOrigin, Cartesian2, defined, Entity, PinBuilder, SceneTransforms} from "cesium"
// eslint-disable-next-line
import { createDefaultImageryProviderViewModels } from "cesium"
import { FiLayers, FiLink2, FiSettings, FiGlobe, FiInfo } from "react-icons/fi"
import { MdFlightTakeoff, MdTimeline } from "react-icons/md"
import FcxTimeline from "./timeline"
import LayerList from "./layerList"
import emitter from "../helpers/event"
import DOIList from "./doiList"
import CampaignInfoLinks from "./campaignInfo"
import Settings from "./settings"
import { getGPUInfo, adjustHeightOfPanels } from "../helpers/utils"
import { mapboxUrl, cesiumDefaultAccessToken } from "../config"
import { checkPath } from "../helpers/path"

import Modal from "./Modal"
import Marker from './Marker'
import geoJson from './chicago-parks2.json'

import "rc-dock/dist/rc-dock.css"
import "../css/dock.css"
// import { url } from "inspector";

let viewer

/*
  Useful links related to adding additional layers to base layer picker
  https://stackoverflow.com/questions/48291191/adding-mapbox-imagery-to-cesium-baselayerpicker
  https://github.com/CesiumGS/cesium/blob/master/Source/Widgets/BaseLayerPicker/createDefaultImageryProviderViewModels.js
  
  console.log(createDefaultImageryProviderViewModels())
*/

const getProviderViewModels = () =>{
  const providerViewModels = []

  providerViewModels.push(
    new ProviderViewModel({
      name: "Bing Maps Aerial with Labels",
      iconUrl: buildModuleUrl("Widgets/Images/ImageryProviders/bingAerialLabels.png"),
      tooltip: "Bing Maps aerial imagery with labels, provided by Cesium ion",
      category: "Cesium ion",
      creationFunction: function () {
        return createWorldImagery({
          style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
        })
      },
    })
  )

  providerViewModels.push(
    new ProviderViewModel({
      name: "Mapbox Streets Dark",
      iconUrl: buildModuleUrl("Widgets/Images/ImageryProviders/mapboxStreets.png"),
      category: "Mapbox",
      tooltip: "Mapbox Streets Dark",
      creationFunction: function () {
        return new UrlTemplateImageryProvider({
          url: mapboxUrl,
        })
      },
    })
  )
  return providerViewModels
}

let getCampaignTab = (campaign) => {
  
  const logo = campaign.logo
  const description = campaign.description

  return {
    title: (
      <div>
        <MdFlightTakeoff /> Campaign{" "}
      </div>
    ),
    content: (
      <div style={{ textAlign: "center" }}>
        <p>
          <img alt="Campaign Logo" style={{ height: "80%", width: "80%" }} src={logo} />
          <br /> {description}
        </p>
      </div>
    ),
  }
}

let box = (campaign) => ({
  dockbox: {
    mode: "horizontal",

    children: [
      {
        mode: "vertical",

        children: [
          {
            tabs: [
              {...getCampaignTab(campaign), id: "tabCampaign" },
              {
                title: (
                  <div>
                    <FiInfo /> Links{" "}
                  </div>
                ),
                id: "tabCampaignLinks",
                content: <CampaignInfoLinks campaign={campaign} />,
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
                content: <LayerList campaign={campaign} />,
              },
              {
                title: (
                  <div>
                    <FiLink2 /> Data{" "}
                  </div>
                ),
                id: "tabData",
                content: <DOIList campaign={campaign}/>,
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
                <span className="gpuName">Detected GPU: {getGPUInfo().gpuName}</span>
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
            content: <FcxTimeline campaign={campaign} />,
          },
          {
            title: (
              <div>
                <FiLayers /> Subsets{" "}
              </div>
            ),
            id: "subsets",
            content: <div>Subset Data</div>,
          },
        ],
      },
    ],
  },
  floatbox: {
    mode: 'float',
    children: [
      {
        tabs: [
            {
              title: (
                <div>
                  <FiLayers /> Subsetting{" "}
                </div>
              ),
              id: "subsettingTool",
              closable: false,
              content: <div>Hello! lets start Subsetting</div>,
            },
        ],
        x: (1920-400-35), y: (983-200), w: 400, h: 200 // based off component with .dock-layout class. TODO: make dynamic
      }
    ]
  }
})

let createViewer = () => {
  if (!checkPath()) return
  Ion.defaultAccessToken = cesiumDefaultAccessToken

  viewer = new Viewer("cesiumContainer", {
    //Use Cesium World Terrain
    // terrainProvider: createWorldTerrain(),
    baseLayerPicker: true,
    skyBox: false,
    automaticallyTrackDataSourceClocks: false,
    navigationHelpButton: true,
    homeButton: false,
    sceneModePicker: true,
    shadows: false,
    infoBox: false,
    imageryProviderViewModels: getProviderViewModels(),
    selectedImageryProviderViewModel: getProviderViewModels()[1],
  })

  // geoJson.fieldCampaignImages.forEach((element)=>{
  //   var image = new Image()
  //   image.crossOrigin = 'anonymous';
  //   image.src = element.imageURL

  //   var pinBuilder = new PinBuilder();
  //   //pinBuilder.fromMakiIconId("hospital", Color.RED, 48),
  //   viewer.entities.add({
  //     position : Cartesian3.fromDegrees(element.coordinates[0], element.coordinates[1]),
  //     name:element.id,
  //     billboard : {
  //       image : pinBuilder.fromMakiIconId('star', Color.GREEN, 48),
  //       width : 32,
  //       height : 32,
  //     },
  //     label : {
  //       // text: element.id.toString(),
  //       font : '14pt monospace',
  //       style: LabelStyle.FILL_AND_OUTLINE,
  //       outlineWidth : 2,
  //       verticalOrigin : VerticalOrigin.TOP,
  //       pixelOffset : new Cartesian2(1, 32)
  //     }
  //   });
  // })


  viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
    if (defined(selectedEntity)) {
        if (defined(selectedEntity.name)) {
          console.log('Selected ' + selectedEntity.name);
          const ref = React.createRef();
          ref.current = document.createElement('div');
          ReactDOM.render(
            <Modal id={selectedEntity.name}/>,
            ref.current
          )
          viewer.selectedEntity = undefined
        } else {
          console.log('Unknown entity selected.');
        }
    } else {
      console.log('Deselected.');
    }
  });
}

let checkViewer = () => {
  setTimeout(() => {
    if(!checkPath()) return
    let cesiumActive = document.getElementById("cesiumContainer")
    
    if(cesiumActive) cesiumActive = cesiumActive.querySelectorAll("canvas")[0]

    if (!cesiumActive) {
      createViewer()
      adjustHeightOfPanels()
    }
    else {
      checkViewer()
    }
  }, 500)
}

/* 
  Useful links related to Dock
  https://codesandbox.io/s/0mjo76mnz0?file=/src/styles.css
*/
class Dock extends React.Component {
  

  componentDidMount() {
    createViewer()
    if (viewer) {
      console.log("%c Viewer initialization successful", "background: green; color: white; display: block;")
    }
  }
  onDragNewTab = (e) => { }

  onLayoutChange = (newLayout, currentTabId) => {
    
    this.setState({ layout: newLayout })
    checkViewer()
  }
  render() {
    emitter.emit("dockRender")
    return (
      <>
      <DockLayout
        defaultLayout={
          box(this.props.campaign)
        }
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          right: 10,
          bottom: 10,
        }}
        onLayoutChange={this.onLayoutChange}
      />
      </>
    )
  }
}

export { Dock, viewer }
