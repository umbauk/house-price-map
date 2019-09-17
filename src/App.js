import React, { Component } from 'react';
import './App.css';
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings';
import Config from './config.js'; // API Keys
import loadJS from './loadJS.js'; // loads Google Maps API script

/* global google */

/* Bugs:
[ ] propertyDetails array seems to have too many results returned
*/

/* To do:
[x] display Map
[x] put text on address (get address, format, send to Maps API, receive back coords, put text at coords)
[x] upload price data to MongoDB
[x] write server code
[x] connect MongoDB to app
[x] collate coords for addresses
[x] put all prices on map
[x] only pull from mongoDB the coordinates for houses within current map view e.g. where lat < lat of top/bottom of screen
[ ] remove markers when zoom out, add markers when zoom in
[x] when click prices, open info window with address, sale date and sale price (may be more than one sale date and price)
[ ] when have same/very similar coordinates, collapse into one box with list of addresses and prices (e.g. apartments)
[ ] calculate today prices of properties
[ ] handle VAT on new properties
[ ] put estimated prices on map for all houses that don't have price data properties
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
    };

    this.initMap = this.initMap.bind(this);
    this.updateListings = this.updateListings.bind(this);
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

  async initMap() {
    const zoom = 18;
    let map = {};

    let mapConfig = {
      center: {
        lat: 53.304779,
        lng: -6.289283,
      },
      zoom,
    };
    map = await new google.maps.Map(this.mapElement, mapConfig);
    map.addListener('dragend', () => this.updateListings());

    this.setState({
      map: map,
      center: {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      },
    });
  }

  async updateListings() {
    try {
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

      markersArray = await getPlacesAndUpdateListings(this.state.map, {
        lat: this.state.map.getCenter().lat(),
        lng: this.state.map.getCenter().lng(),
      });

      this.setState({
        markers: markersArray,
      });
    } catch (error) {
      console.error(error);
    }
  }

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
