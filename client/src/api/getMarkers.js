/*
 *   Create markers and info windows for each property
 */

/* global google */
import { addMarkerToMap, addDuplicateMarkerToMap } from './addMarkerToMap';
import { refreshNearbyPlaces } from './refreshNearbyPlaces';
import { lookForOverlaps } from './lookForOverlaps';

export async function getMarkers(
  map, // Google Map object
) {
  let markersArray = [];

  // Get list of property sales in current visible map area
  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map);

  // Separate properties into single and grouped properties
  let [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray] = lookForOverlaps(
    visiblePropertyDetailsArray.propertyDetails,
  );

  const infowindow = new google.maps.InfoWindow({
    content: '',
  });

  deDupedPropertyDetailsArray.forEach(async property => {
    let marker = addMarkerToMap(
      { lat: property.lat, lng: property.lng },
      property.price,
      property.date_of_sale,
      property.address,
      map,
      infowindow,
    );
    markersArray.push(marker);
  });

  duplicatesPropertyDetailsArray.forEach(async property => {
    let marker = addDuplicateMarkerToMap(property, map, infowindow);
    markersArray.push(marker);
  });

  return markersArray;
}
