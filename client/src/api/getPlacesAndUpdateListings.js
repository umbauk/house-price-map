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

// Looks for properties that are very close together and groups them as duplicates
// in order to display the details in a single pop-up box
function deDupeProperties(visiblePropertyDetailsArray) {
  // sort by lat and lng
  visiblePropertyDetailsArray.sort((a, b) => a.lat - b.lat || a.lng - b.lng);

  // Identify if price labels will overlap, if so mark as a duplicate record
  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
    if (propertiesAreClose(visiblePropertyDetailsArray[i], visiblePropertyDetailsArray[i + 1])) {
      visiblePropertyDetailsArray[i].duplicate = true;
      visiblePropertyDetailsArray[i + 1].duplicate = true;
    }
  }

  let duplicatesPropertyDetailsArray = [];
  let duplicateCount = 0;

  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
    // if there are duplicates of same or very close property in array, remove them to a new array
    if (visiblePropertyDetailsArray[i].duplicate) {
      let duplicateRowCount = 0;
      duplicatesPropertyDetailsArray[duplicateCount] = [];
      duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[i]);

      let j = i + 1;
      // properties are sorted by lat and lng so if the next property in the array is not close to it
      // we have found all the duplicates
      while (
        propertiesAreClose(visiblePropertyDetailsArray[i], visiblePropertyDetailsArray[j]) &&
        j < visiblePropertyDetailsArray.length
      ) {
        duplicatesPropertyDetailsArray[duplicateCount].push(visiblePropertyDetailsArray[j]);
        duplicateRowCount++;
        // if we've reached the end of the array, break the loop
        if (j >= visiblePropertyDetailsArray.length - 1) {
          break;
        } else j++;
      }

      i += duplicateRowCount; // skips the matching duplicates
      duplicateCount++;
    }
  }

  // create an array without any duplicates in it
  let deDupedPropertyDetailsArray = visiblePropertyDetailsArray.filter(
    property => !property.duplicate,
  );

  return [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray];
}

// checks if properties are close together
function propertiesAreClose(property1, property2) {
  if (
    property1.lat <= property2.lat + 0.00008 &&
    property1.lat >= property2.lat - 0.00008 &&
    property1.lng <= property2.lng + 0.00008 &&
    property1.lng >= property2.lng - 0.00008
  ) {
    return true;
  } else return false;
}
