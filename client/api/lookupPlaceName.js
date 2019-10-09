/* global google */

export async function lookupPlaceName(map, placeToLookup, currentMapCenter) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map);
    service.textSearch(
      {
        query: placeToLookup,
        location: new google.maps.LatLng(53.3419176, -6.2677217),
        radius: 20000,
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          let centerCoordsOfPlace = results[0].geometry.location;

          resolve(centerCoordsOfPlace);
        } else {
          // revert to default center
          alert('Place not found');
          console.log(status);
          let centerCoordsOfPlace = currentMapCenter;
          resolve(centerCoordsOfPlace);
        }
      },
    );
  });
}
