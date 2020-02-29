const { db } = require('../admin');
const geoHash = require('ngeohash');

module.exports = async (req, res, next) => {
  let snapshot = await db.collection('house-sales').get();

  // Push references of insights into array so can map over them, which allows
  // them to run in parallel and return a value on completion
  let snapshotRefObjects = [];
  snapshot.forEach(doc =>
    snapshotRefObjects.push({
      ref: doc.ref,
      lat: doc.data().lat,
      lng: doc.data().lng,
    }),
  );

  // Memory limit exceeded before reaching this point
  // Batch read (where lat < 53.1 and increment) or use transactions
  console.log('Finished snapshotRefObjects...');

  let counter = 0;
  let batchNum = 0;
  batchArr[0] = db.batch();

  // Wait for all .update() operations to finish and return resolved promise to
  // end cloud function successfully

  snapshotRefObjects.map(async object => {
    counter++;
    let hash = geoHash.encode(object.lat, object.lng);
    batchArr[batchNum].update(object.ref, { geoHash: hash });

    if (counter > 490) {
      counter = 0;
      batchNum++;
      batchArr[batchNum] = db.batch();
    }
  });

  for (const batch of batchArr) {
    await batch.commit().catch(err => {
      console.log('XXXXXXXXXXXX Error with batch write:', err);
      res.status(500).end();
    });
  }

  console.log(counter, 'documents updated');
  res.status(200).end();
};
