import React, { Component, useState } from 'react';
import './App.css';
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings';
import { getCurrentLocation } from './api/getCurrentLocation';
import { lookupPlaceName } from './api/lookupPlaceName';
import loadJS from './loadJS.js'; // loads Google Maps API script
import {
  Card,
  CardText,
  CardBody,
  CardTitle,
  Button,
  Input,
  Popover,
  PopoverHeader,
  PopoverBody,
} from 'reactstrap';

/* global google */

const About = props => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const toggle = () => setPopoverOpen(!popoverOpen);

  return (
    <div>
      <Button id='about' type='button'>
        About
      </Button>
      <Popover
        placement='auto'
        trigger='legacy'
        isOpen={popoverOpen}
        target='about'
        toggle={toggle}
      >
        <PopoverHeader>About</PopoverHeader>
        <PopoverBody>
          housepricemap.ie was designed and built by Darren Greenfield as a project to help him
          learn to code. During his move to Palo Alto, California he came across lots of great US
          property websites showing rental and price history. He was surprised that similar sites
          didn't exist for his home town of Dublin, Ireland. So he tried to make one...{' '}
          <div className='spacer' />
          You can read more about him in his{' '}
          <a href='https://medium.com/@darren.g' target='_blank' rel='noopener noreferrer'>
            Medium blog posts
          </a>{' '}
          , check out his personal website at
          <a href='https://darrengreenfield.com' target='_blank' rel='noopener noreferrer'>
            darrengreenfield.com
          </a>
          , or contact him at{' '}
          <a href='mailto:darren.greenfield@gmail.com'>darren@darrengreenfield.com</a>
        </PopoverBody>
      </Popover>
    </div>
  );
};

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
    map.addListener('zoom_changed', () => {
      this.updateListings();
    });

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

      // only display results when map zoomed in enough
      if (this.state.map.getZoom() >= 17) {
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

  keyPress = evt => {
    if (evt.keyCode === 13) this.locationBtnClicked(evt);
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
              <CardTitle>
                <div id='house-price-map'>
                  <a href='/'>House Price Map</a>
                </div>
                <div id='subtitle'>Dublin property sales mapped</div>
              </CardTitle>
              <CardText>Where do you want to search?</CardText>
              <Input
                type='text'
                spellCheck='false'
                name='location'
                id='locationTextBox'
                placeholder=''
                onKeyDown={this.keyPress}
                onChange={this.locationTextBoxChanged}
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
