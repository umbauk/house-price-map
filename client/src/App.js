/*
 * Main App file. Contains UI components and UI logic
 */

import React, { Component } from 'react';
import './App.css';
import { getMarkers } from './api/getMarkers';
import { getCurrentLocation } from './api/getCurrentLocation';
import { lookupPlaceName } from './api/lookupPlaceName';
import { About } from './api/about.js';
import loadGoogleScript from './loadGoogleScript'; // loads Google Maps API script
import { Card, CardText, CardBody, CardTitle, Button, Input } from 'reactstrap';

// global google is required to access the google package which is loaded in loadJS
/* global google */

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: {
        lat: 53.3419176,
        lng: -6.2677217,
      },
      map: {},
      markers: [],
      initialState: true,
    };

    this.initMap = this.initMap.bind(this);
    this.updateListings = this.updateListings.bind(this);
    this.keyPress = this.keyPress.bind(this);
  }

  async componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    const KEY =
      window.location.hostname === 'localhost'
        ? process.env.REACT_APP_GOOGLE_API_KEY
        : 'AIzaSyDxB_adL1-Q4Zila6wRYn8LbO0RJtGRz5w'; // host restricted
    await loadGoogleScript(
      `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&callback=initMap`,
    );
  }

  /*
   * Initialize the Google map, add listeners and set state
   */
  async initMap() {
    const zoom = 12;
    let map = {};

    let mapConfig = {
      center: {
        lat: 53.3419176,
        lng: -6.2677217,
      },
      zoom,
    };
    map = await new google.maps.Map(this.mapElement, mapConfig);
    map.addListener('dragend', () => this.updateListings('dragend'));
    map.addListener('zoom_changed', () => {
      this.updateListings('zoom_changed');
    });

    this.setState({
      map: map,
      center: {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      },
    });
  }

  async updateListings(evt) {
    try {
      // if the app is in initial state, do not execute function twice for map move/zoom change and button click
      if (this.state.initialState === true) {
        this.setState({ initialState: false });
        return;
      }

      let markersArray;

      // clear markers
      this.state.markers.forEach(marker => {
        marker.setMap(null);
      });

      this.setState({
        center: {
          lat: this.state.map.getCenter().lat(),
          lng: this.state.map.getCenter().lng(),
        },
        markers: [],
      });

      // only display results when map zoomed in enough
      if (this.state.map.getZoom() >= 17) {
        markersArray = await getMarkers(this.state.map);

        this.setState({
          markers: markersArray,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  locationTextBoxChanged = evt => {
    if (!this.state.autoCompleteAddedToTextBox) {
      this.setState({
        autoCompleteAddedToTextBox: true,
      });
      const input = document.getElementById('locationTextBox');
      const options = { types: ['address'], componentRestrictions: { country: 'ie' } };
      this.autocomplete = new google.maps.places.Autocomplete(input, options);
      this.autocomplete.addListener('place_changed', this.handlePlaceSelect);
    }
    this.setState({
      locationTextBoxValue: evt.target.value,
    });
  };

  handlePlaceSelect = () => {
    // when place selected from dropdown box, add coordinates of selected place to state
    if (this.autocomplete.getPlace().geometry) {
      this.setState({
        locationCoords: this.autocomplete.getPlace().geometry.location,
      });
    }
  };

  keyPress = evt => {
    // If return is pressed in the input box, treat it like submit button pressed
    if (evt.keyCode === 13) this.locationBtnClicked(evt);
  };

  locationBtnClicked = async evt => {
    const map = this.state.map;
    const centerCoords = await this.getCenterCoords(evt, map);

    // stop this.updateListings() being called twice from button click and zoom change
    this.setState({ initialState: true });
    map.panTo(centerCoords);
    map.setCenter(centerCoords);
    map.setZoom(18);
    this.updateListings();
  };

  getCenterCoords = (evt, map) => {
    return new Promise(async (resolve, reject) => {
      if (evt.target.name === 'useCurrentLocation') {
        resolve(await getCurrentLocation());
        // if place not selected from Maps autocomplete dropdown list, user has typed in place. Manually
        // lookup input box contents in Google Places API
      } else if (!this.state.locationCoords) {
        resolve(
          await lookupPlaceName(
            map,
            this.state.locationTextBoxValue,
            this.state.center, // default value
          ),
        );
      } else {
        resolve(this.state.locationCoords);
      }
    });
  };

  render() {
    return (
      <div id='parent-window'>
        <div id='map-element' ref={mapElement => (this.mapElement = mapElement)} />

        <div id='cardtable-container'>
          <Card id='welcome-card'>
            <CardBody>
              <CardTitle>
                <div className='text-primary' id='house-price-map'>
                  <a href='/'>House Price Map</a>
                </div>
              </CardTitle>
              <CardText>
                <b>Zoom in</b> or <b>enter a location</b> below to see house sales in the area
              </CardText>
              <Input
                type='text'
                spellCheck='false'
                name='location'
                id='locationTextBox'
                placeholder='Enter Dublin location e.g. Shrewsbury Road'
                onKeyDown={this.keyPress}
                onKeyUp={this.locationTextBoxChanged}
              />
              <Button
                className='button'
                color='primary'
                onClick={this.locationBtnClicked}
                name='location'
              >
                Submit
              </Button>
              <Button
                className='button'
                color='primary'
                onClick={this.locationBtnClicked}
                name='useCurrentLocation'
              >
                Use current location
              </Button>
              <About />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }
}

export default App;
