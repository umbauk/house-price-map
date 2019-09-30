import React, { Component } from 'react';
import './App.css';
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings';
import { getCurrentLocation } from './api/getCurrentLocation';
import { lookupPlaceName } from './api/lookupPlaceName';
import Config from './config.js'; // API Keys
import loadJS from './loadJS.js'; // loads Google Maps API script
import { Card, CardText, CardBody, CardTitle, Button, Input } from 'reactstrap';

// db.shane_lynn_dump.aggregate([ { $match: {} }, { $unset: "_id" }, { $merge: { into: db.dublin, on: [ "date_of_sale", "address" ] } } ])
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
[x] remove markers when zoom out, add markers when zoom in
[x] when click prices, open info window with address, sale date and sale price (may be more than one sale date and price)
[x] when have same/very similar coordinates, collapse into one box with list of addresses and prices (e.g. apartments)
[x] populate coordinates from shanelynn.ie data
[x] Add text box for users to search for address
[ ] Add FAQ / Info button and pop up
[ ] calculate today prices of properties, Add toggle button to convert all prices to today's prices
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
        lat: 53.3419176,
        lng: -6.2677217,
      },
      map: {},
      markers: [],
    };

    this.initMap = this.initMap.bind(this);
    this.updateListings = this.updateListings.bind(this);
  }

  async componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    const KEY = Config.passwords.GOOGLE_API_KEY;
    await loadJS(
      `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&callback=initMap`,
    );
  }

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
      console.log('updateListings() running...');
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
        console.log(this.state.map);
        markersArray = await getPlacesAndUpdateListings(this.state.map);

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

  locationBtnClicked = async evt => {
    const map = this.state.map;
    const centerCoords = await this.getCenterCoords(evt, map);

    map.panTo(centerCoords);
    map.setCenter(centerCoords);
    map.setZoom(18);
    this.updateListings();
  };

  getCenterCoords = (evt, map) => {
    return new Promise(async (resolve, reject) => {
      if (evt.target.name === 'useCurrentLocation') {
        resolve(await getCurrentLocation());
      } else if (!this.state.locationCoords) {
        // if place not selected from Maps autocomplete dropdown list, user has typed in place manually
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
              <CardTitle>Welcome to Dublin House Price Map</CardTitle>
              <CardText>Where do you want to search?</CardText>
              <Input
                type='text'
                name='location'
                id='locationTextBox'
                placeholder=''
                onChange={this.locationTextBoxChanged}
              />
              <Button className='button' onClick={this.locationBtnClicked} name='location'>
                Submit
              </Button>
              <Button
                className='button'
                onClick={this.locationBtnClicked}
                name='useCurrentLocation'
              >
                Use current location
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }
}

export default App;
