import {
  balloonElectricFieldMeter,
  combinedLma,
  glm,
  mobileRadar,
  nexrad,
  nsslMobileSounding,
  oswegoSoundings,
} from "./helpers"
import { LEE_IOP2_LISTING_DATES } from "./helpers/leeIop2"

class LayerGenerator {
  constructor() {
    this.instruments = [
      "combinedLma",
      "mobileRadar",
      "nexrad",
      "glm",
      "oswegoSoundings",
      "nsslMobileSounding",
      "balloonElectricFieldMeter",
    ]
    this.listing_dates = LEE_IOP2_LISTING_DATES
  }

  buildInstrument(instrumentType, index, listingDate) {
    switch (instrumentType) {
      case "combinedLma":
        return combinedLma(index, listingDate)
      case "mobileRadar":
        return mobileRadar(index, listingDate)
      case "nexrad":
        return nexrad(index, listingDate)
      case "glm":
        return glm(index, listingDate)
      case "oswegoSoundings":
        return oswegoSoundings(index, listingDate)
      case "nsslMobileSounding":
        return nsslMobileSounding(index, listingDate)
      case "balloonElectricFieldMeter":
        return balloonElectricFieldMeter(index, listingDate)
      default:
        return null
    }
  }

  generateLayer() {
    return this.listing_dates
      .map((listingDate) => ({
        date: listingDate,
        items: this.instruments
          .map((instrumentType, index) => this.buildInstrument(instrumentType, index, listingDate))
          .filter((layer) => layer && layer.listingDate === listingDate),
      }))
      .filter((group) => group.items.length > 0)
  }
}

const layersGen = new LayerGenerator()
const instrumentLayers = layersGen.generateLayer()

export default instrumentLayers
