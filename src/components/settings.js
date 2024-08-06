import React, { Component } from "react"
import emitter from "../helpers/event"
import Typography from "@material-ui/core/Typography"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import Slider from "@material-ui/core/Slider"
import RadioGroup from "@material-ui/core/RadioGroup"
import Radio from "@material-ui/core/Radio"
import FormControl from "@material-ui/core/FormControl"
import FormLabel from "@material-ui/core/FormLabel"

class Settings extends Component {

  componentDidMount() {

    // Register to receive flight layers
    this.receiveFlightLayers();

    // Trigger an event to request the latest flight layers when component mounts
    emitter.emit("requestFlightLayers");
  
  }

  constructor(props) {
    super(props)
    this.state = {
      selectedFlight : '',
      flightLayers : [],
      followFlightChecked : false
    }
  }

  receiveFlightLayers = () => {
    
    emitter.on("receiveFlightLayers", (selectedFlights) => {
      const sf = selectedFlights.filter(layer => 
        layer.toLowerCase().includes('track')
      );
      console.log("In emitter.on receiveFlightLayers" ,sf);
      this.setState(() => ({
        flightLayers: sf, 
        selectedFlight: this.state.followFlightChecked ? sf.at(-1) : this.state.selectedFlight || ''}), 
        () => {
        console.log("Received layers for rendering:", this.state.flightLayers);
        this.emitToViz(); 
      });

    });
  }

  trackairplaneChange = (event) => {
    const isChecked = event.target.checked;
    this.setState(prevState => ({
      followFlightChecked: isChecked,
      selectedFlight: isChecked ? this.state.flightLayers.at(-1) : ''
    }), this.emitToViz);
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      selectedFlight: value
    }), this.emitToViz);
  }

  emitToViz = () => {
    emitter.emit("trackairplaneChange", this.state.selectedFlight)
  }
   
  // function valuetext(value) {
  valuetext(value) {
    return `${value} seconds`
  }

  marks = [
    {
      value: 60,
      label: "60s",
    },

    {
      value: 900,
      label: "900s",
    },
    {
      value: 1800,
      label: "1800s",
    },
  ]
  render() {
    return (
      <div style={{ padding: 10 }}>
        <FormControlLabel control={<Checkbox onChange={this.trackairplaneChange} name="trackairplane" />} label="Follow Airplane" />
        
        <FormControl> {
          this.state.followFlightChecked &&
          (
            <>
              <br />
              <FormLabel id="demo-controlled-radio-buttons-group">Flight Layers</FormLabel>
            </>
          )
          }
         
          <RadioGroup
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={this.state.selectedFlight || ''}
            onChange={this.handleChange}
          >
            {
              this.state.followFlightChecked && this.state.flightLayers.map((layer) => {
                return <FormControlLabel key={layer} value={layer} control={<Radio />} label={layer} />;
              })
            }
          
          </RadioGroup>
        </FormControl>
        <hr />
        <Typography id="discrete-slider" gutterBottom>
          Linger Time (seconds)
        </Typography>
        <Slider
          defaultValue={300}
          getAriaValueText={this.valuetext}
          aria-labelledby="discrete-slider"
          step={60}
          min={60}
          max={1800}
          marks={this.marks}
          track={false}
          valueLabelDisplay="on"
          onChange={(event, newValue) => {
            emitter.emit("lingerTimeChange", newValue)
          }}
        />
      </div>
    )
  }
}

export default Settings
