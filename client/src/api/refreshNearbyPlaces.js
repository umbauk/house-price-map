/*
 *   Sends the lat/lng bounds of the current Google Map window to the server to get back
 *   a list of all houses sold in that area ready for rendering
 */

export async function refreshNearbyPlaces(map) {
  // map.getBounds() returns bottom left and top right lat/lng coords:
  // e.g. ((53.302753042851606, -6.291490458019325), (53.3067535745927, -6.2870111689644546))
  let mapBounds = map.getBounds().toJSON();

  try {
    let fetchUrl = '/api/getPrices/';

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

    let jsonData = await visiblePropertyDetailsArray.json();
    return jsonData;
  } catch (err) {
    console.error(err);
  }
}
