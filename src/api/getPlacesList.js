/* global google */

export default function getPlacesList(service, request) {
  return new Promise((resolve, reject) => {
    service.textSearch(request, (placesArray, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log('Places Service status: ok');
        // Add the placeType ('cafe' or 'kids activity') to each entry in array
        let returnArray = placesArray.map(element => {
          return Object.assign(element, { placeType: request.placeType });
        });
        resolve(returnArray);
      } else {
        console.log(google.maps.places.PlacesServiceStatus);
        resolve(google.maps.places.PlacesServiceStatus);
      }
    });
  });
}
