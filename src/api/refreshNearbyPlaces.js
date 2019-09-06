/* global google */
import getPlacesList from './getPlacesList.js';

class MapSearchRequest {
  constructor(query, location, radius, placeType) {
    this.query = query;
    this.location = location;
    this.radius = radius;
    this.placeType = placeType;
  }
}

export async function refreshNearbyPlaces(
  map,
  mapCenter,
  searchRadius,
  activityShouldBeIndoors,
  travelMethod,
) {
  const centerPoint = mapCenter;
  const service = new google.maps.places.PlacesService(map);

  const kidsPlacesArray = await getKidsPlacesArray(
    activityShouldBeIndoors,
    centerPoint,
    searchRadius,
    service,
  );

  return getCafesArray(kidsPlacesArray, service, travelMethod).then(
    limitedCafePlacesArray => {
      const flattenedPlacesArray = kidsPlacesArray.concat(
        ...limitedCafePlacesArray,
      );
      return Promise.resolve(flattenedPlacesArray);
    },
  );
}

export async function getKidsPlacesArray(
  activityShouldBeIndoors,
  centerPoint,
  searchRadius,
  service,
) {
  let kidsActivityQuery = activityShouldBeIndoors
    ? 'indoor play center'
    : 'playground';
  const kidsActivityRequest = new MapSearchRequest(
    kidsActivityQuery,
    centerPoint,
    searchRadius,
    'kids activity',
  );

  const kidsActivityPlaceArray = await getPlacesList(
    service,
    kidsActivityRequest,
  );

  const highRatedKidsPlacesArray = filterOutLowRatedPlaces(
    kidsActivityPlaceArray,
    4.0,
  );
  // Because Google Maps' MapSearchRequest() does not strictly use searchRadius when supplied
  // we have to do our own test to filter out places not within our user-defined radius
  const withinRadiusKidsPlacesArray = checkPlaceIsWithinRadius(
    centerPoint,
    searchRadius,
    highRatedKidsPlacesArray,
  );
  const sortedKidsPlacesArray = sortByRating(withinRadiusKidsPlacesArray);
  return limitNumberOfPlaces(sortedKidsPlacesArray, 5);
}

export async function getCafesArray(
  limitedKidsPlacesArray,
  service,
  travelMethod,
) {
  const cafeQuery = 'kid friendly coffee shop'; // Google Maps text query for cafes
  // shorten distance from activity to cafe if travel method is 'walk'
  const searchRadiusInMeters = travelMethod === 'walk' ? '500' : '1000';
  let promiseArray = limitedKidsPlacesArray.map(kidsPlace => {
    const cafeRequest = new MapSearchRequest(
      cafeQuery,
      kidsPlace.geometry.location,
      searchRadiusInMeters,
      'cafe',
    );
    return new Promise(async (resolve, reject) => {
      let cafeList = await getPlacesList(service, cafeRequest);
      const highRatedCafesArray = filterOutLowRatedPlaces(cafeList, 4.0);
      const withinRadiusCafesArray = checkPlaceIsWithinRadius(
        {
          lat: kidsPlace.geometry.location.lat(),
          lng: kidsPlace.geometry.location.lng(),
        },
        searchRadiusInMeters,
        highRatedCafesArray,
      );
      const sortedCafesArray = sortByRating(withinRadiusCafesArray);
      const topRatedCafe = limitNumberOfPlaces(sortedCafesArray, 1);
      resolve(topRatedCafe);
    });
  });
  return Promise.all(promiseArray).then(limitedCafePlacesArray => {
    return Promise.resolve(limitedCafePlacesArray);
  });
}

export function filterOutLowRatedPlaces(flattenedPlacesArray, lowestRating) {
  return flattenedPlacesArray.filter(place => place.rating >= lowestRating);
}

export function checkPlaceIsWithinRadius(
  centerPoint,
  searchRadius,
  highRatedKidsPlacesArray,
) {
  // Converts radius in metres to distance in lat/lng
  // source: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
  const searchRadiusInLatDegrees =
    ((parseInt(searchRadius) / 6378137) * 180) / Math.PI; // 0.00898315284 @ 1000m
  const searchRadiusInLngDegrees =
    (parseInt(searchRadius) /
      (6378137 * Math.cos(Math.PI * (centerPoint.lat / 180)))) *
    (180 / Math.PI); // 0.01131487697 @ 1000m

  return highRatedKidsPlacesArray.filter(place => {
    return (
      place.geometry.location.lat() <
        centerPoint.lat + searchRadiusInLatDegrees &&
      place.geometry.location.lat() >
        centerPoint.lat - searchRadiusInLatDegrees &&
      place.geometry.location.lng() <
        centerPoint.lng + searchRadiusInLngDegrees &&
      place.geometry.location.lng() > centerPoint.lng - searchRadiusInLngDegrees
    );
  });
}

function sortByRating(filteredPlacesArray) {
  return filteredPlacesArray.sort((a, b) => b.rating - a.rating);
}

export function limitNumberOfPlaces(sortedKidsPlacesArray, limit) {
  // Limits number of results per type to 'limit'
  return sortedKidsPlacesArray
    .filter(place => place.placeType === 'cafe')
    .slice(0, limit)
    .concat(
      sortedKidsPlacesArray
        .filter(place => place.placeType === 'kids activity')
        .slice(0, limit),
    );
}
