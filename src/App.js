import React, { Component } from 'react';
import './App.css';
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings';
import { getCurrentLocation } from './api/getCurrentLocation';
import Config from './config.js'; // API Keys
import loadJS from './loadJS.js'; // loads Google Maps API script

/* global google */

/* Bugs:

*/

/* To do:
[x] display Map
[x] put text on address (get address, format, send to Maps API, receive back coords, put text at coords)
[x] upload price data to MongoDB
[ ] write server code
[ ] connect MongoDB to app
[x] collate coords for addresses
[ ] put all prices on map
[ ] calculate today prices of properties
[ ] handle VAT on new properties
[ ] put estimated prices on map for all housesthat don't have price data properties
  - find all addresses on street or within certain bounds


Stretch:
[ ] Ability for users to submit corrections/new data e.g. add new addresses, move markers, correct amounts
*/

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: {
        lat: 53.304779,
        lng: -6.289283,
      },
      map: {},
      markers: [],
      location: null,
      locationTextBoxValue: '',
      locationCoords: null,
    };

    this.initMap = this.initMap.bind(this);
    this.updateListings = this.updateListings.bind(this);
    this.getDataFromDb = this.getDataFromDb.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    const KEY = Config.passwords.GOOGLE_API_KEY;
    loadJS(
      `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&callback=initMap`,
    );
  }

  initMap() {
    const zoom = 18;
    let map = {};

    let mapConfig = {
      center: {
        lat: 53.304779,
        lng: -6.289283,
      },
      zoom,
    };
    map = new google.maps.Map(this.mapElement, mapConfig);
    map.addListener('dragend', () => this.updateListings());

    this.setState({
      map: map,
      center: {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      },
    });
  }

  getDataFromDb = () => {
    fetch('http://localhost:3001/getPrices')
      .then(data => data.json())
      .then(res => console.log(res));
  };

  async updateListings(searchRadius) {
    try {
      let placeMarkersArray, placeLabelsAndUrlArray;

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

      this.getDataFromDb();

      [
        placeLabelsAndUrlArray,
        placeMarkersArray,
      ] = await getPlacesAndUpdateListings(
        this.state.map,
        {
          lat: this.state.map.getCenter().lat(),
          lng: this.state.map.getCenter().lng(),
        },
        this.state.searchRadius || searchRadius,
      );

      this.setState({
        markers: [...placeMarkersArray],
      });
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
      this.autocomplete = new google.maps.places.Autocomplete(input);
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

  locationBtnClicked = async evt => {
    const map = this.state.map;
    const centerCoords = await this.getCenterCoords(evt, map);

    this.setState({
      location: 1,
    });
    map.panTo(centerCoords);
    map.setCenter(centerCoords);
    map.setZoom(13);
  };

  getCenterCoords = (evt, map) => {
    return new Promise(async (resolve, reject) => {
      //let centerCoords;
      if (evt.target.name === 'useCurrentLocation') {
        resolve(await getCurrentLocation());
      } else if (!this.state.locationCoords) {
        // if place not selected from Maps autocomplete dropdown list, user has typed in place manually
        resolve(1);
      } else {
        resolve(this.state.locationCoords);
      }
    });
  };

  render() {
    return (
      <div id='parent-window'>
        <div
          id='map-element'
          ref={mapElement => (this.mapElement = mapElement)}
        />
      </div>
    );
  }
}

export default App;
