import { addMarkersToMap } from './addMarkersToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
  searchRadius,
) {
  console.log('2) getPlacesAndUpdateListings starting...');
  let marker;
  let addressCoords = await refreshNearbyPlaces(map, mapCenter);
  [addressCoords, marker] = addMarkersToMap(addressCoords, map);

  console.log('5) refreshPlacesAndUpdateListings finished');
  return [addressCoords, marker];
}
