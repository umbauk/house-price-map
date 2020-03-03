/*
 * Gets user's current location
 */

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      reject(
        new Error(
          'Get User Location error. Try granting permission for this site to use your location',
        ),
      );
    else {
      return Promise.resolve(
        navigator.geolocation.getCurrentPosition(position => {
          let currentCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(currentCoordinates);
        }),
      );
    }
  });
}
