/*
 * Add markers to the google map and format the info windows
 */

/* global google */
import blackMarker from '../img/black_wide.png';
import blackDupeMarker from '../img/black_wide_dupe2.png';
import moment from 'moment';

/*
 * Add marker to the map for a single house
 */
export function addMarkerToMap(addressCoords, price, date_of_sale, address, map, infowindow) {
  const image = {
    url: blackMarker, //'',
    size: new google.maps.Size(50, 15),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20),
  };

  let formattedPrice = formatPrice(price);

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

  marker.addListener('click', () => {
    infowindow.setContent(
      `<p><b>Address:</b> ${address}</p>` +
        `<p><b>Date of Sale:</b> ${moment(date_of_sale, 'MM/DD/YYYY').format('DD MMM YYYY')}</p>`,
    );
    infowindow.open(map, marker);
  });

  return marker;
}

/*
 * Add marker to the map for multi property location
 */
export function addDuplicateMarkerToMap(property, map, infowindow) {
  const image = {
    url: blackDupeMarker, //'',
    size: new google.maps.Size(50, 15),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(20, 20),
  };

  property.forEach((sale, index) => {
    property[index].formattedPrice = formatPrice(sale.price);
  });

  sortProperties(property);

  const marker = new google.maps.Marker({
    position: { lat: property[0].lat, lng: property[0].lng },
    map: map,
    label: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px',
      text: property[property.length - 1].formattedPrice, // show the most recent sale price on the map
    },
    icon: image,
  });

  let infoWindowContent = createInfoWindowContent(property);

  marker.addListener('click', () => {
    infowindow.setContent(infoWindowContent);
    infowindow.open(map, marker);
  });

  return marker;
}

// Sort properties by date of sale
function sortProperties(property) {
  property.sort((a, b) => {
    a = new Date(a.date_of_sale);
    b = new Date(b.date_of_sale);
    return a > b ? 1 : a < b ? -1 : 0;
  });
}

// if price > 1m then format as millions, else as thousands
function formatPrice(price) {
  if (price >= 1000000) {
    return (
      new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(price / 1000000) + 'm'
    );
  } else {
    return (
      new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(price / 1000) + 'k'
    );
  }
}

function createInfoWindowContent(property) {
  let infoWindowContent = '';
  // If all addresses in the array are equal then this is a house with multiple sales
  // If all addresses in the array are not equal then this is an apartment block with multiple different addresses,
  // or a group of properties very close together
  if (property.every(sale => sale.address === property[0].address)) {
    // House or grouped properties
    infoWindowContent = `<p><b>Address:</b> ${property[0].address}</p>`;
    property.forEach((sale, index) => {
      infoWindowContent += `<b>${moment(sale.date_of_sale, 'MM/DD/YYYY').format(
        'DD MMM YYYY',
      )}</b> - ${property[index].formattedPrice}<br>`;
    });
  } else {
    // Apartments
    infoWindowContent = `<table><thead><tr><td><b>Date of Sale</b></td><td><b>Address</b></td><td><b>Sale Price</b></td></tr></thead>
      <tbody>`;
    property.forEach((sale, index) => {
      infoWindowContent += `<tr><td>${moment(sale.date_of_sale, 'MM/DD/YYYY').format(
        'DD MMM YYYY',
      )}</td> <td>${property[index].address}</td> <td>${property[index].formattedPrice}</td></tr>`;
    });
    infoWindowContent += `</tbody></table>`;
  }
  return infoWindowContent;
}
