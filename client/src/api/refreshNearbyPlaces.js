export async function refreshNearbyPlaces(map) {
  let mapBounds = map.getBounds().toJSON();
  // map.getBounds(): ((53.302753042851606, -6.291490458019325), (53.3067535745927, -6.2870111689644546))

  try {
    let fetchUrl = '';
    if (window.location.hostname === 'localhost') {
      fetchUrl = 'http://localhost:3001/api/getPrices/';
    } else {
      fetchUrl = '/api/getPrices/';
    }

    let visiblePropertyDetailsArray = await fetch(
      fetchUrl +
        mapBounds.south +
        '/' +
        mapBounds.west +
        '/' +
        mapBounds.north +
        '/' +
        mapBounds.east,
    );

    return await visiblePropertyDetailsArray.json();
  } catch (err) {
    console.error(err);
  }
}

export function checkPlaceIsWithinRadius(centerPoint, searchRadius, highRatedKidsPlacesArray) {
  // Converts radius in metres to distance in lat/lng
  // source: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
  const searchRadiusInLatDegrees = ((parseInt(searchRadius) / 6378137) * 180) / Math.PI; // 0.00898315284 @ 1000m
  const searchRadiusInLngDegrees =
    (parseInt(searchRadius) / (6378137 * Math.cos(Math.PI * (centerPoint.lat / 180)))) *
    (180 / Math.PI); // 0.01131487697 @ 1000m

  return highRatedKidsPlacesArray.filter(place => {
    return (
      place.geometry.location.lat() < centerPoint.lat + searchRadiusInLatDegrees &&
      place.geometry.location.lat() > centerPoint.lat - searchRadiusInLatDegrees &&
      place.geometry.location.lng() < centerPoint.lng + searchRadiusInLngDegrees &&
      place.geometry.location.lng() > centerPoint.lng - searchRadiusInLngDegrees
    );
  });
}
