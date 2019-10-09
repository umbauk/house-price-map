export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error('Get User Location error'));
    else {
      return Promise.resolve(
        navigator.geolocation.getCurrentPosition(position => {
          let currentCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('1) getCurrentLocation() complete');
          resolve(currentCoordinates);
        }),
      );
    }
  });
}
