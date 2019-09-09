/* global google */
import getPlacesList from './getPlacesList.js';

export async function refreshNearbyPlaces(map, mapCenter) {
  const centerPoint = mapCenter;
  const service = new google.maps.places.PlacesService(map);
  const geocoder = new google.maps.Geocoder();
  const address = '74 Rathdown Park, Terenue, Dublin 6W';

  let addressCoords = await getPlacesList(geocoder, address);

  console.log(addressCoords);
  return addressCoords;
}

export function checkPlaceIsWithinRadius(
  centerPoint,
  searchRadius,
  highRatedKidsPlacesArray,
) {
  // Converts radius in metres to distance in lat/lng
  // source: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
  const searchRadiusInLatDegrees =
    ((parseInt(searchRadius) / 6378137) * 180) / Math.PI; // 0.00898315284 @ 1000m
  const searchRadiusInLngDegrees =
    (parseInt(searchRadius) /
      (6378137 * Math.cos(Math.PI * (centerPoint.lat / 180)))) *
    (180 / Math.PI); // 0.01131487697 @ 1000m

  return highRatedKidsPlacesArray.filter(place => {
    return (
      place.geometry.location.lat() <
        centerPoint.lat + searchRadiusInLatDegrees &&
      place.geometry.location.lat() >
        centerPoint.lat - searchRadiusInLatDegrees &&
      place.geometry.location.lng() <
        centerPoint.lng + searchRadiusInLngDegrees &&
      place.geometry.location.lng() > centerPoint.lng - searchRadiusInLngDegrees
    );
  });
}
