import React, { useEffect, useState } from "react"
import { makeStyles } from "@material-ui/core/styles"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import Switch from "@material-ui/core/Switch"
import Checkbox from "@material-ui/core/Checkbox"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import CircularProgress from "@material-ui/core/CircularProgress"
import FlightIcon from "@material-ui/icons/Flight"
import Card from "@material-ui/core/Card"
import { FaSatellite } from "react-icons/fa"
import { GrSatellite } from "react-icons/gr"
import { BsLayers } from "react-icons/bs"
import { MdDateRange } from "react-icons/md"
import { useSelector, useDispatch } from "react-redux"
import Box from "@material-ui/core/Box"
import Accordion from "@material-ui/core/Accordion"
import AccordionSummary from "@material-ui/core/AccordionSummary"
import AccordionDetails from "@material-ui/core/AccordionDetails"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import allActions from "../state/actions"
import {BsCardImage} from 'react-icons/bs'
import Dow7LayerPanel from "./Dow7LayerPanel"
import EfmLayerPanel from "./EfmLayerPanel"
import NexradLayerPanel from "./NexradLayerPanel"
import GlmLayerPanel from "./GlmLayerPanel"
import SoundingLayerPanel from "./SoundingLayerPanel"
import { getLeeLayersAvailabilityInfo, enrichLeeLayerDatasetTimes } from "../helpers/leeDataAvailability"
import {
  formatLeeAvailabilityTimes,
  getLeeAvailabilityBarLayout,
} from "../helpers/leeAvailabilityTimeline"

import { IonWorldImageryStyle, ProviderViewModel, buildModuleUrl, createWorldImagery, UrlTemplateImageryProvider, Viewer, Ion, Cartesian3, Color, LabelStyle, VerticalOrigin, Cartesian2, defined, Entity, PinBuilder, SceneTransforms} from "cesium"
import { Dock, viewer } from "./dock"
import geoJson from '../data/chicago-parks2.json'

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
}))

let imageToggle = false;
function isLeeCampaign(campaign) {
  return campaign.layers?.some((group) =>
    group.items?.some((layer) => layer.fieldCampaignName === "LEE")
  )
}

export default function LayerList({ campaign }) {
  const classes = useStyles()
  const state = useSelector((state) => state)
  const dispatch = useDispatch()
  const leeDateFilter = isLeeCampaign(campaign)
  const [activeListingDate, setActiveListingDate] = useState(
    campaign.layers[0]?.date || null
  )
  const [leeAvailableLayerIds, setLeeAvailableLayerIds] = useState(null)
  const [leeDatasetTimesByLayerId, setLeeDatasetTimesByLayerId] = useState({})

  useEffect(() => {
    if (!leeDateFilter) {
      setLeeAvailableLayerIds(null)
      setLeeDatasetTimesByLayerId({})
      return undefined
    }

    let cancelled = false
    const allLayers = campaign.layers.flatMap((group) => group.items || [])

    getLeeLayersAvailabilityInfo(allLayers).then(({ availableIds, datasetTimesByLayerId }) => {
      if (!cancelled) {
        setLeeAvailableLayerIds(availableIds)
        setLeeDatasetTimesByLayerId(datasetTimesByLayerId)
      }
    })

    enrichLeeLayerDatasetTimes(allLayers).then((datasetTimesByLayerId) => {
      if (!cancelled && Object.keys(datasetTimesByLayerId).length) {
        setLeeDatasetTimesByLayerId((current) => ({
          ...current,
          ...datasetTimesByLayerId,
        }))
      }
    })

    return () => {
      cancelled = true
    }
  }, [campaign, leeDateFilter])

  let dates = []

  const selectListingDate = (listingDate) => {
    setActiveListingDate(listingDate)
    if (leeDateFilter && listingDate) {
      dispatch(allActions.listActions.removeLayersByDate(listingDate))
    }
  }

  const handleLayerToggle = (layerId, listingDate) => {
    const turningOn = state.selectedLayers.indexOf(layerId) === -1
    if (leeDateFilter && turningOn) {
      selectListingDate(listingDate)
    }
    dispatch(allActions.listActions.handleToggle(layerId))
  }

  for (const [itemIndex, itemValue] of campaign.layers.entries()) {
    const layerItems = itemValue

    const layers = []

    // special imageviewer layer for 2017-05-17 GOES-R field campaign
    if (campaign.title === 'GOES-R PLT Field Campaign' && layerItems.date === '2017-05-17') {
      layers.push((
          <Card key={"primary-card-Image_viewer_2017-05-17"} variant="outlined">
              <ListItem key={"primary-item-Image_viewer_2017-05-17"}>
                <ListItemIcon><BsCardImage /></ListItemIcon>
                <ListItemText id={`primary-list-label-Image_viewer_2017-05-17`} primary="Image Viewer" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={lightningImageViewerChangeHandler}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem key={"secondary-item-variable-Image_viewer_2017-05-17"}>
                <ListItemText id={`secondary-list-label-Image_viewer_2017-05-17`} primary={
                  <span style={{ fontSize: 12 }}>
                    Toggle to enable/disable Markers
                  </span>
                }></ListItemText>
              </ListItem>
            </Card>
        )
      )
    }

    if (leeDateFilter && leeAvailableLayerIds === null) {
      dates.push(
        <Accordion
          key={"panel-loading-" + itemIndex}
          expanded={activeListingDate === layerItems.date}
          onChange={(_event, isExpanded) => {
            if (isExpanded) {
              selectListingDate(layerItems.date)
            } else {
              setActiveListingDate((current) =>
                current === layerItems.date ? null : current
              )
            }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-loading-content">
            <div style={{ width: "100%" }}>
              <Box display="flex" justifyContent="center" m={1} p={1}>
                <Box p={1}>
                  <MdDateRange /> {layerItems.date}
                </Box>
              </Box>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List className={classes.root}>
              <ListItem>
                <ListItemIcon>
                  <CircularProgress size={20} />
                </ListItemIcon>
                <ListItemText primary="Checking instrument availability…" />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      )
      continue
    }

    const visibleLayerItems = leeDateFilter
      ? layerItems.items.filter((layer) => leeAvailableLayerIds.has(layer.layerId))
      : layerItems.items

    if (leeDateFilter && !visibleLayerItems.length) {
      continue
    }

    const visibleLayerIds = visibleLayerItems.map((layer) => layer.layerId)
    const selectedOnDateCount = visibleLayerIds.filter((id) =>
      state.selectedLayers.includes(id)
    ).length
    const allSelected =
      visibleLayerIds.length > 0 && selectedOnDateCount === visibleLayerIds.length
    const someSelected = selectedOnDateCount > 0 && !allSelected

    if (visibleLayerItems.length > 0) {
      layers.push(
        <Card key={`all-instruments-${layerItems.date}`} variant="outlined">
          <ListItem dense>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(event) => {
                    const shouldSelect = event.target.checked
                    if (leeDateFilter && shouldSelect) {
                      selectListingDate(layerItems.date)
                    }
                    visibleLayerIds.forEach((layerId) => {
                      const isSelected = state.selectedLayers.includes(layerId)
                      if (shouldSelect !== isSelected) {
                        dispatch(allActions.listActions.handleToggle(layerId))
                      }
                    })
                  }}
                  color="primary"
                />
              }
              label={<span style={{ fontSize: 13, fontWeight: 600 }}>All instruments</span>}
              style={{ margin: 0 }}
            />
          </ListItem>
        </Card>
      )
    }

    for (const [layerIndex, layerValue] of visibleLayerItems.entries()) {
      // icons and information gathering for layer card; needed for layerlist sidebar and layer legend
      let icon = <BsLayers />

      let legendImage
      const isDow7Layer = layerValue.displayMechanism === "dow7"
      const isEfmLayer = layerValue.displayMechanism === "efm"
      const isNexradLayer = layerValue.displayMechanism === "nexrad"
      const isGlmLayer = layerValue.displayMechanism === "glm"
      const isSoundingLayer = layerValue.displayMechanism === "soundingCzml"

      if (!isDow7Layer && !isEfmLayer && !isNexradLayer && !isGlmLayer && !isSoundingLayer) {
        let legendUrl = ""

        if (layerValue.type === "track") {
          legendUrl = campaign.legends["track"].url
        } else if (campaign.legends[layerValue.shortName]) {
          legendUrl = campaign.legends[layerValue.shortName].url
        }

        if (legendUrl) {
          legendImage = (
            <div>
              <img className="legend" src={legendUrl} alt="legend" />
            </div>
          )
        }
      }

      const layerLegend = campaign.legends?.[layerValue.shortName]
      const layerRangeStyle = layerLegend?.timelineGradient
        ? { background: layerLegend.timelineGradient }
        : layerLegend?.color
          ? { backgroundColor: layerLegend.color }
          : { backgroundColor: "#4a90d9" }

      if (layerValue.platform === "satellite") {
        icon = <FaSatellite />
      } else if (layerValue.platform === "air") {
        icon = <FlightIcon />
      } else if (layerValue.platform === "ground") {
        icon = <GrSatellite />
      }
      if (state.layerStatus.inProgress.indexOf(layerValue.layerId) !== -1) {
        icon = <CircularProgress />
      }
      if (state.layerStatus.loaded.indexOf(layerValue.layerId) !== -1) {
        const loadedTint = layerLegend?.color || "green"
        icon = <div style={{ color: loadedTint }}>{icon}</div>
      }

      let layerVariable
      if (layerValue.variableName) {
        layerVariable = (
          <span>
            {" "}
            <i>{"Displaying: "}</i> {layerValue.variableName + (layerValue.unit ? " (" + layerValue.unit + ")" : "")}
          </span>
        )
      }

      const probedTimes = leeDatasetTimesByLayerId[layerValue.layerId]
      const layerStartIso = probedTimes?.start || layerValue.start
      const layerEndIso = probedTimes?.end || layerValue.end

      let layerAvailability
      let layerAvailabilityRange
      if (layerStartIso && layerEndIso) {
        const { startLabel, endLabel, utcSuffix } = formatLeeAvailabilityTimes(
          layerStartIso,
          layerEndIso
        )

        layerAvailability = (
          <span>
            {" "}
            <i>{"Availability: "}</i> {startLabel + " - " + endLabel + utcSuffix}
          </span>
        )

        const barLayout = leeDateFilter
          ? getLeeAvailabilityBarLayout(layerItems.date, layerStartIso, layerEndIso)
          : null

        if (barLayout) {
          layerAvailabilityRange = (
            <div style={{ marginTop: 6, width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  opacity: 0.7,
                  marginBottom: 2,
                }}
              >
                <span>{barLayout.iopStartLabel}</span>
                <span>{barLayout.iopEndLabel}</span>
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 8,
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${barLayout.leftPct}%`,
                    width: `${Math.max(barLayout.widthPct, 1)}%`,
                    height: "100%",
                    borderRadius: 4,
                    minWidth: 2,
                    ...layerRangeStyle,
                  }}
                />
              </div>
            </div>
          )
        } else {
          layerAvailabilityRange = (
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 4,
                marginTop: 6,
                ...layerRangeStyle,
              }}
            />
          )
        }
      }

      // with the gathered information, populate and push the layer card to the layers array.
      layers.push(
        <Card key={"primary-card-" + layerIndex} variant="outlined">
          <ListItem key={"primary-item-" + layerIndex}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText id={`primary-list-label-${layerValue.layerId}`} primary={layerValue.displayName} />

            <ListItemSecondaryAction>
              <Switch
                edge="end"
                onChange={() =>
                  handleLayerToggle(
                    layerValue.layerId,
                    layerItems.date
                  )
                }
                checked={state.selectedLayers.indexOf(layerValue.layerId) !== -1}
                inputProps={{
                  "aria-labelledby": `switch-list-label-${layerValue.layerId}`,
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
          {layerAvailability && (
            <ListItem key={"secondary-item-availability" + layerIndex} dense style={{ display: "block" }}>
              <ListItemText
                id={`secondary-list-availability-${layerValue.layerId}`}
                style={{ width: "100%", marginRight: 0 }}
                primary={
                  <span style={{ fontSize: 12, display: "block", width: "100%" }}>
                    {layerAvailability}
                    {layerAvailabilityRange}
                  </span>
                }
              />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && layerVariable && (
            <ListItem key={"secondary-item-variable" + layerIndex}>
              <ListItemText
                id={`secondary-list-label-${layerValue.layerId}`}
                primary={<span style={{ fontSize: 12 }}>{layerVariable}</span>}
              />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && isDow7Layer && (
            <ListItem key={"secondary-item-dow7-panel" + layerIndex}>
              <ListItemText id={`secondary-list-dow7-${layerValue.layerId}`} primary={<Dow7LayerPanel />} />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && isEfmLayer && (
            <ListItem key={"secondary-item-efm-panel" + layerIndex}>
              <ListItemText id={`secondary-list-efm-${layerValue.layerId}`} primary={<EfmLayerPanel />} />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && isNexradLayer && (
            <ListItem key={"secondary-item-nexrad-panel" + layerIndex}>
              <ListItemText id={`secondary-list-nexrad-${layerValue.layerId}`} primary={<NexradLayerPanel />} />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && isGlmLayer && (
            <ListItem key={"secondary-item-glm-panel" + layerIndex}>
              <ListItemText id={`secondary-list-glm-${layerValue.layerId}`} primary={<GlmLayerPanel />} />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && isSoundingLayer && (
            <ListItem key={"secondary-item-sounding-panel" + layerIndex}>
              <ListItemText
                id={`secondary-list-sounding-${layerValue.layerId}`}
                primary={<SoundingLayerPanel shortName={layerValue.shortName} />}
              />
            </ListItem>
          )}
          {state.selectedLayers.indexOf(layerValue.layerId) !== -1 && legendImage && (
            <ListItem key={"secondary-item-legend" + layerIndex}>
              <ListItemText id={`secondary-list-label-${layerValue.layerId}`}>{legendImage}</ListItemText>
            </ListItem>
          )}
        </Card>
      )
    }

    dates.push(
      <Accordion
        key={"panel" + itemIndex}
        expanded={activeListingDate === layerItems.date}
        onChange={(_event, isExpanded) => {
          if (isExpanded) {
            selectListingDate(layerItems.date)
          } else {
            setActiveListingDate((current) =>
              current === layerItems.date ? null : current
            )
          }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" key={"summary-panel" + itemIndex}>
          <div style={{ width: "100%" }}>
            <Box display="flex" justifyContent="center" m={1} p={1}>
              <Box p={1}>
                <MdDateRange /> {layerItems.date}
              </Box>
            </Box>
          </div>
        </AccordionSummary>
        <AccordionDetails key={"details-panel" + itemIndex}>
          <List key={itemIndex} className={classes.root}>
            {layers}
          </List>
        </AccordionDetails>
      </Accordion>
    )
  }

  return dates
}

const lightningImageViewerChangeHandler = (e) =>{
  imageToggle = !imageToggle;
  if(imageToggle){
    geoJson.fieldCampaignImages.forEach((element)=>{
      var pinBuilder = new PinBuilder();
      //pinBuilder.fromMakiIconId("hospital", Color.RED, 48),
      viewer.entities.add({
        position : Cartesian3.fromDegrees(element.coordinates[0], element.coordinates[1]),
        name: "imageViewer-" + element.id,
        billboard : {
          image : pinBuilder.fromMakiIconId('star', Color.GREEN, 48),
          width : 32,
          height : 32,
        },
        label : {
          // text: element.id.toString(),
          font : '14pt monospace',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth : 2,
          verticalOrigin : VerticalOrigin.TOP,
          pixelOffset : new Cartesian2(1, 32)
        }
      });
    })
    console.log(viewer.entities)
  }else{
    viewer.entities.removeAll();
  }
}
