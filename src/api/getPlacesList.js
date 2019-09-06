export default function getPlacesList(service, request) {
  return new Promise((resolve, reject) => {
    service.geocode({ 'address': request }, (results, status) => {
      if (status === 'OK') {
        console.log('Places Service status: ok');

        resolve({ 'lat': results[0].geometry.location.lat(), 'lng': results[0].geometry.location.lng()});
      } else {
          console.log(status);
          reject(status);
      }
    });
  });
}
