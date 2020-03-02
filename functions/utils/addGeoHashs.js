/*
 * Utility function which added Geo Hash codes to each document based on its lat/lng coords.
 * Function uses batch reads and writes to cope with large volume and runs writes in parallel
 * to run fast enough to avoid timeout.
 */

const { db } = require('../admin');
const geoHash = require('ngeohash');

module.exports = () => {
  const TOP_OF_DUBLIN = 53.45;
  const BOTTOM_OF_DUBLIN = 53.2;
  const NUM_OF_BATCHES = 20;
  return main();

  async function main() {
    let interval = (TOP_OF_DUBLIN - BOTTOM_OF_DUBLIN) / NUM_OF_BATCHES;

    for (
      let lowestLat = TOP_OF_DUBLIN - interval;
      lowestLat >= BOTTOM_OF_DUBLIN;
      lowestLat -= interval
    ) {
      console.log(lowestLat, 'starting');
      let snapshot = await batchRead(lowestLat, interval);
      console.log(lowestLat, 'Batch read');
      let snapshotRefObjects = extractData(snapshot);
      console.log(lowestLat, 'Snapshot Ref Object created');
      let batchArr = addUpdatesToBatch(snapshotRefObjects);
      console.log(lowestLat, 'Added to batch');
      await submitBatches(batchArr);
    }

    return true;
  }

  async function batchRead(lowestLat, interval) {
    let snapshot = await db
      .collection('house-sales')
      .where('lat', '>=', lowestLat)
      .where('lat', '<=', lowestLat + interval)
      .get()
      .catch(err => {
        console.log('Error getting data:', err);
      });
    console.log(snapshot.size, 'documents read');
    return snapshot;
  }

  // Push references of insights into array so can map over them, which allows
  // them to run in parallel and return a value on completion
  function extractData(snapshot) {
    let snapshotRefObjects = [];
    snapshot.forEach(doc =>
      snapshotRefObjects.push({
        ref: doc.ref,
        lat: doc.data().lat,
        lng: doc.data().lng,
      }),
    );
    return snapshotRefObjects;
  }

  // Wait for all .update() operations to finish and return resolved promise to
  // end cloud function successfully
  function addUpdatesToBatch(snapshotRefObjects) {
    let batchArr = [];
    batchArr[0] = db.batch();
    let batchNum = 0;
    let actionCounter = 0;

    snapshotRefObjects.map(async object => {
      actionCounter++;
      let hash = geoHash.encode(object.lat, object.lng);
      batchArr[batchNum].update(object.ref, { geoHash: hash });

      // batch writes are limited to 500 actions
      if (actionCounter >= 499) {
        actionCounter = 0;
        batchNum++;
        batchArr[batchNum] = db.batch();
      }
    });
    return batchArr;
  }

  async function submitBatches(batchArr) {
    let counter = 0;
    // Use Promise.all() and map to commit batches in parallel
    await Promise.all(
      batchArr.map(batch => {
        batch
          .commit()
          .then(() => {
            console.log('Batch ' + counter + ' submitted');
            counter++;
          })
          .catch(err => {
            console.log('XXXXXXXXXXXX Error with batch write:', counter, err);
            return Promise.reject(err);
          });
      }),
    );

    return Promise.resolve();
  }
};
