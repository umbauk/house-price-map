/* global google */
import { addMarkerToMap, addDuplicateMarkerToMap } from './addMarkerToMap.js';
import { refreshNearbyPlaces } from './refreshNearbyPlaces.js';

export async function getPlacesAndUpdateListings(
  map, // Google Map object
) {
  let markersArray = [];

  let visiblePropertyDetailsArray = await refreshNearbyPlaces(map);

  let [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray] = deDupeProperties(
    visiblePropertyDetailsArray.propertyDetails,
  );
  console.log(deDupedPropertyDetailsArray);
  console.log(duplicatesPropertyDetailsArray);

  const infowindow = new google.maps.InfoWindow({
    content: '',
  });

  deDupedPropertyDetailsArray.forEach(async property => {
    let marker = addMarkerToMap(
      { lat: property.lat, lng: property.lng },
      property.price,
      property.date_of_sale,
      property.address,
      map,
      infowindow,
    );
    markersArray.push(marker);
  });

  duplicatesPropertyDetailsArray.forEach(async property => {
    let marker = addDuplicateMarkerToMap(property, map, infowindow);
    markersArray.push(marker);
  });

  return markersArray;
}

function deDupeProperties(visiblePropertyDetailsArray) {
  // sort by lat and lng
  visiblePropertyDetailsArray.sort((a, b) => a.lat - b.lat || a.lng - b.lng);

  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
    if (
      visiblePropertyDetailsArray[i].lat <= visiblePropertyDetailsArray[i + 1].lat + 0.00008 &&
      visiblePropertyDetailsArray[i].lat >= visiblePropertyDetailsArray[i + 1].lat - 0.00008 &&
      visiblePropertyDetailsArray[i].lng <= visiblePropertyDetailsArray[i + 1].lng + 0.00008 &&
      visiblePropertyDetailsArray[i].lng >= visiblePropertyDetailsArray[i + 1].lng - 0.00008
    ) {
      visiblePropertyDetailsArray[i].duplicate = true;
      visiblePropertyDetailsArray[i + 1].duplicate = true;
    }
  }

  let duplicatesPropertyDetailsArray = [];
  let duplicateCount = 0;

  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
    // if there are duplicates of same property in array, remove them to a new array
    if (visiblePropertyDetailsArray[i].duplicate) {
      let duplicateRowCount = 0;
      duplicatesPropertyDetailsArray[duplicateCount] = [];
      duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[i]);

      let j = i + 1;
      while (
        visiblePropertyDetailsArray[i].lat <= visiblePropertyDetailsArray[j].lat + 0.00008 &&
        visiblePropertyDetailsArray[i].lat >= visiblePropertyDetailsArray[j].lat - 0.00008 &&
        visiblePropertyDetailsArray[i].lng <= visiblePropertyDetailsArray[j].lng + 0.00008 &&
        visiblePropertyDetailsArray[i].lng >= visiblePropertyDetailsArray[j].lng - 0.00008 &&
        j < visiblePropertyDetailsArray.length
      ) {
        duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[j]);
        duplicateRowCount++;
        if (j >= visiblePropertyDetailsArray.length - 1) {
          break;
        } else j++;
      }

      i += duplicateRowCount; // skips the matching duplicates
      duplicateCount++;
    }
  }

  let deDupedPropertyDetailsArray = visiblePropertyDetailsArray.filter(
    property => !property.duplicate,
  );

  return [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray];
}
