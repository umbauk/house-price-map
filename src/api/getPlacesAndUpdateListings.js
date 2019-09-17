import { addMarkerToMap } from './addMarkerToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
) {
  let markersArray = [];

  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map, mapCenter);
  console.log(visiblePropertyDetailsArray);

  visiblePropertyDetailsArray.propertyDetails.forEach(async house => {
    let marker = addMarkerToMap(
      { lat: house.lat, lng: house.lng },
      house.price,
      map,
    );
    markersArray.push(marker);
  });

  return markersArray;
}
