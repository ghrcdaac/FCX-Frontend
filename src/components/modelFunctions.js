import { Transforms, Cartesian3, Math as cMath, HeadingPitchRoll, PinBuilder, Color as ColorCesium, VerticalOrigin } from "cesium";
import { viewer } from "./dock"

var heading = cMath.toRadians(-150);
var pitch = cMath.toRadians(45);
var roll = cMath.toRadians(30);
var hpr = new HeadingPitchRoll(heading, pitch, roll);
var orientation = Transforms.headingPitchRollQuaternion(Cartesian3.ZERO, hpr);

export function handleOlympexApu(viewer, lon, lat, onPinCreated) {
    var instrumentPosition = Cartesian3.fromDegrees(lon, lat, 0); // Same as the instrument's position
    var pinPosition = Cartesian3.fromDegrees(lon, lat, 7000);
    if(!viewer.entities.getById("APU")) {
        viewer.entities.add({
            id: 'APU',
            name: 'Autonomous Parsivel Unit',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/apu/apu_parsivel.glb',
                scale: 5,
                minimumPixelSize: 20,
                color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
    setTimeout(() => {
        let entity = viewer.entities.getById("APU");
        if (entity) {
            const pinBuilder = new PinBuilder();
            let pin = viewer.entities.add({
                id: 'APU_pin',
                name: `olympexapu-pin`,
                position: pinPosition,
                orientation: orientation,
                billboard: {
                    image: pinBuilder.fromColor(ColorCesium.ROYALBLUE, 48).toDataURL(),
                    verticalOrigin: VerticalOrigin.TOP,
                },
            });
            // To add an icon for pin
            // const pin = Promise.resolve(
            //     pinBuilder.fromMakiIconId("warehouse", Color.ROYALBLUE, 20)
            //   ).then(function (canvas) {
            //     return viewer.entities.add({
            //       name: "APU plots",
            //       id: "APU_pin",
            //       position: pinPosition,
            //       orientation: orientation,
            //       scale: 5,
            //       billboard: {
            //         image: canvas.toDataURL(),
            //         verticalOrigin: VerticalOrigin.TOP,
            //         horizontalOrigin: HorizontalOrigin.CENTER
            //       },
            //     });
            //   });
            if (onPinCreated) {
                onPinCreated(pin);
            }
        }
    }, 1000); 
}

export function handleOlympexMrr(viewer, lon, lat) {
    var instrumentPosition = Cartesian3.fromDegrees(lon, lat, 0); // Same as the instrument's position
    if(!viewer.entities.getById("MRR")) {
        viewer.entities.add({
            id: 'MRR',
            name: 'Micro Rain Radar',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/mrr/mrr_model.glb',
                scale: 1,
                minimumPixelSize: 10,
                color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
}

export function handleOlympexD3rKa(viewer) {
    console.log(viewer.entities)
    var instrumentPosition = Cartesian3.fromDegrees(-124.21125, 47.27728, 0);
    if(!viewer.entities.getById("D3RKa")) {
        viewer.entities.add({
            id: 'D3RKa',
            name: 'Dual-frequency Dual-polarized Doppler Radar(Ka)',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/d3r/d3r_model.glb',
                scale: 0.1,
                minimumPixelSize: 10,
                color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
}

export function handleOlympexD3rKu(viewer) {
    console.log(viewer.entities)
    var instrumentPosition = Cartesian3.fromDegrees(-124.21125, 47.27728, 0);
    if(!viewer.entities.getById("D3RKu")) {
        viewer.entities.add({
            id: 'D3RKu',
            name: 'Dual-frequency Dual-polarized Doppler Radar(Ku)',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/d3r/d3r_model.glb',
                scale: 0.1,
                minimumPixelSize: 10,
                color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
}

export function handleOlympexNpol(viewer) {
    heading = cMath.toRadians(36);
    pitch = cMath.toRadians(135);
    roll = cMath.toRadians(40);
    hpr = new HeadingPitchRoll(heading, pitch, roll);
    orientation = Transforms.headingPitchRollQuaternion(Cartesian3.ZERO, hpr);
    var instrumentPosition = Cartesian3.fromDegrees(-124.21125, 47.27728, 0);
    if(!viewer.entities.getById("NPOL")) {
        viewer.entities.add({
            id: 'NPOL',
            name: 'NASA S-Band Dual Polarimetric Doppler Radar',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/npol/npol_model.glb',
                scale: 0.1,
                minimumPixelSize: 10,
                // color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
}

export function handleOlympexNexrad(viewer, lon, lat, id) {
    var instrumentPosition = Cartesian3.fromDegrees(lon, lat, 1000);
    if(!viewer.entities.getById(`NEXRAD-${id}`)) {
        viewer.entities.add({
            id: `NEXRAD-${id}`,
            name: 'NEXt Generation Weather RADar system',
            orientation: orientation,
            position: instrumentPosition,
            model: {
                uri: 'https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com/Olympex/instrument-processed-data/nexrad/nexrad_model.glb',
                scale: 0.5,
                minimumPixelSize: 10,
                // color: new ColorCesium(1.0, 1.0, 0.4, 1)
            }
        });
    }
}