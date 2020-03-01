export async function refreshNearbyPlaces(map) {
  let mapBounds = map.getBounds().toJSON();
  // map.getBounds(): ((53.302753042851606, -6.291490458019325), (53.3067535745927, -6.2870111689644546))

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
