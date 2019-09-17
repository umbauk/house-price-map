/* global google */
import { addMarkerToMap } from './addMarkerToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
) {
  let markersArray = [];

  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map, mapCenter);
  console.log(visiblePropertyDetailsArray);

  const infowindow = new google.maps.InfoWindow({
    content:
      '<p><b>Date:</b> 1 Jan 2019</p>' +
      '<p><b>Address:</b> 74 Rathdown Park, Terenure, Dublin</p>',
  });

  visiblePropertyDetailsArray.propertyDetails.forEach(async house => {
    let marker = addMarkerToMap(
      { lat: house.lat, lng: house.lng },
      house.price,
      map,
      infowindow,
    );
    markersArray.push(marker);
  });

  return markersArray;
}
