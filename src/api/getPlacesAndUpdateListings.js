
import { addMarkersToMap } from './addMarkersToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
  searchRadius,
) {
  let placeAndLabelsArray, markerArray;
  console.log('2) getPlacesAndUpdateListings starting...');

  const filteredPlacesArray = await refreshNearbyPlaces(
    map,
    mapCenter,
  );
  [placeAndLabelsArray, markerArray] = addMarkersToMap(
    filteredPlacesArray,
    map,
  );

  console.log('5) refreshPlacesAndUpdateListings finished');
  return [placeAndLabelsArray, markerArray];
}
