import { addMarkerToMap } from './addMarkerToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
  searchRadius,
) {
  let markersArray = [];

  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map, mapCenter);
  console.log(visiblePropertyDetailsArray);

  visiblePropertyDetailsArray.propertyDetails.forEach(house => {
    let marker = addMarkerToMap(
      { lat: house.lat, lng: house.lng },
      house.price,
      map,
    );
    markersArray.push(marker);
  });

  return [visiblePropertyDetailsArray, markersArray];
}
