/* global google */
import blackMarker from '../img/black_wide.png';

export function addMarkerToMap(addressCoords, price, map) {
  const image = {
    url: blackMarker, //'',
    size: new google.maps.Size(50, 15),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20),
  };

  let formattedPrice;
  // if price > 1m then format as millions, else as thousands
  if (price >= 1000000) {
    formattedPrice =
      new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(price / 1000000) + 'm';
  } else {
    formattedPrice =
      new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(price / 1000) + 'k';
  }

  const marker = new google.maps.Marker({
    position: addressCoords,
    map: map,
    label: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px',
      text: formattedPrice,
    },
    icon: image,
  });

  return marker;
}
