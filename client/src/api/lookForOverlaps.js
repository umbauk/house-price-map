/*
 * Looks for properties that are very close together e.g. apartment blocks, and groups them as duplicates
 * in order to display the details in a single pop-up box
 */

/*
 * Checks if properties are close together
 */
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

/*
 * Identifies if properties are close in lat/lng terms. If so, group them into a separate array for
 * formatting differently
 */
export function lookForOverlaps(visiblePropertyDetailsArray) {
  // sort by lat and lng so closest properties are next to each other in list
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

  // If there are duplicates (multiple sales) of same or very close property in array, remove them to a new array
  // so we can format them differently
  for (let i = 0; i < visiblePropertyDetailsArray.length - 1; i++) {
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

        if (j >= visiblePropertyDetailsArray.length - 1) {
          break;
        } else j++;
      }

      i += duplicateRowCount;
      duplicateCount++;
    }
  }

  let deDupedPropertyDetailsArray = visiblePropertyDetailsArray.filter(
    property => !property.duplicate,
  );

  return [deDupedPropertyDetailsArray, duplicatesPropertyDetailsArray];
}
