/* global google */

export function addMarkersToMap(addressCoords, map) {
  const image = {
    url: '',
    size: new google.maps.Size(20, 32),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32),
  };

  const marker = new google.maps.Marker({
    position: addressCoords,
    map: map,
    label: '€250k',
    icon: image, //'./icon.jpg',
  });

  return [addressCoords, marker];
}
