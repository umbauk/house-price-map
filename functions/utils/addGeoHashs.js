const { db } = require('../admin');
const geoHash = require('ngeohash');

module.exports = async () => {
  let snapshot = await db
    .collection('house-sales')
    .get()
    .limit(5);

  // Push references of insights into array so can map over them, which allows
  // them to run in parallel and return a value on completion
  let snapshotRefObjects = [];
  snapshot.forEach(doc =>
    snapshotRefArr.push({
      ref: doc.ref,
      lat: doc.data().lat,
      lng: doc.data().lng,
    }),
  );

  // Wait for all .update() operations to finish and return resolved promise to
  // end cloud function successfully
  return Promise.all(
    snapshotRefObjects.map(async object => {
      let hash = geoHash.encode(object.lat, object.lng);
      console.log(object.ref, hash);
      return await object.ref
        .update({
          geoHash: hash,
        })
        .catch(error => {
          console.log('Error setting geoHash: ', error);
        });
    }),
  );
};
