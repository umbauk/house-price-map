/* global google */

export function addMarkersToMap(addressCoords, map) {
  let greenIconURL1 =
    'https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&text=';
  let redIconURL1 =
    'https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-b.png&text=';
  let iconURL2 =
    '&psize=11&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1';
  const letterLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterLabelIndex = 0;
  let numberLabel = 1;
  let label = '';
  let iconURL1 = '';
  let markerArray = [];

    label = numberLabel++;
    iconURL1 = greenIconURL1;

    let marker = new google.maps.Marker({
      position: addressCoords,
      map: map,
      icon: iconURL1 + label + iconURL2,
    });

  return [addressCoords, marker];
}
