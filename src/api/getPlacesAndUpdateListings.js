/* global google */
import { addMarkerToMap, addDuplicateMarkerToMap } from './addMarkerToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
  mapCenter, // lat, lng object
) {
  let markersArray = [];

  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map, mapCenter);

  let [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray] = deDupeProperties(visiblePropertyDetailsArray.propertyDetails);
  console.log(deDupedPropertyDetailsArray);
  console.log(duplicatesPropertyDetailsArray);

  const infowindow = new google.maps.InfoWindow({
    content: '',
  });

  deDupedPropertyDetailsArray.forEach(async property => {
    let marker = addMarkerToMap({ lat: property.lat, lng: property.lng }, property.price, property.date_of_sale, property.address, map, infowindow);
    markersArray.push(marker);
  });

  /*duplicatesPropertyDetailsArray.forEach(async property => {
    let marker = addDuplicateMarkerToMap(
      { lat: property.lat, lng: property.lng },
      property.price,
      property.date_of_sale,
      property.address,
      map,
      infowindow,
    );
    markersArray.push(marker);
  });*/

  return markersArray;
}

function deDupeProperties(visiblePropertyDetailsArray) {
  // sort by lat and lng
  visiblePropertyDetailsArray.sort((a, b) => a.lat - b.lat || a.lng - b.lng);

  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
    if (
      visiblePropertyDetailsArray[i].lat === visiblePropertyDetailsArray[i + 1].lat &&
      visiblePropertyDetailsArray[i].lng === visiblePropertyDetailsArray[i + 1].lng
    ) {
      visiblePropertyDetailsArray[i].duplicate = true;
      visiblePropertyDetailsArray[i + 1].duplicate = true;
    }
  }

  let duplicatesPropertyDetailsArray = [];
  let duplicateCount = 0;
  let duplicateRowCount = 0;

  for (let i = 0; i < visiblePropertyDetailsArray.length; i++) {
    // if there are duplicates of same property in array, remove them to a new array
    if (visiblePropertyDetailsArray[i].duplicate) {
      duplicatesPropertyDetailsArray[duplicateCount] = [];
      duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[i]);

      let j = i + 1;
      while (
        visiblePropertyDetailsArray[i].lat === visiblePropertyDetailsArray[j].lat &&
        visiblePropertyDetailsArray[i].lng === visiblePropertyDetailsArray[j].lng
      ) {
        duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[j]);
        duplicateRowCount++;
        j++;
      }

      i += duplicateRowCount;
      duplicateCount++;
    }
  }

  let deDupedPropertyDetailsArray = visiblePropertyDetailsArray.filter(property => !property.duplicate);

  return [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray];
}
