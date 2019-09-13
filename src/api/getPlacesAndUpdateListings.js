import { addMarkersToMap } from './addMarkersToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
  searchRadius,
) {
  let marker;
  let addressCoords = await refreshNearbyPlaces(map, mapCenter);
  addressCoords.map(house => {
    addMarkersToMap(
      { lat: house.lat, lng: house.lng },
      house.price,
      this.state.map,
    );
  });
  [addressCoords, marker] = addMarkersToMap(addressCoords, map);

  return [addressCoords, marker];
}
