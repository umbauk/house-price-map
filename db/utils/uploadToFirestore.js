/*
 * Uploads a JSON file to Firestore, creating a new document for each object. Buffered for large files.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');
const fs = require('fs');
const COLLECTION_KEY = 'house-sales'; //name of the collection
const JSON_FILE_LOC = 'property_price_db.json'; // property_price_db

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://house-price-map.firebaseio.com',
});
const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);
let batch = [];

let buf = '';
let counter = 0;
let batchNum = 1;

const readStream = fs.createReadStream(JSON_FILE_LOC, {
  encoding: 'utf8',
});
readStream.on('data', data => {
  buf += data.toString();
  pump();
});

function pump() {
  let start, end;

  // keep going while there's an object somewhere in the buffer
  while ((start = buf.indexOf('{')) >= 0 && (end = buf.indexOf('}')) >= buf.indexOf('{')) {
    processLine(buf.slice(start, end + 1));
    buf = buf.slice(end + 2);
  }
  console.log('Writing to Firebase complete');
}

function processLine(object) {
  if (object.length > 0) {
    counter++;
    var obj = JSON.parse(object);
    console.log(counter, obj);
    batch[batchNum] = firestore.batch();
    batch[batchNum].set(firestore.collection(COLLECTION_KEY).doc(), obj);
    firestore
      .collection(COLLECTION_KEY)
      .doc()
      .set(obj)
      .catch(error => {
        console.error('Error writing document: ', error);
        let dt = new Date();
        fs.writeFile('error-log.txt', dt + ' ' + error);
      });
  }
  if (counter > 450) {
    counter = 0;
    batch[batchNum]
      .commit()
      .then(() => {
        console.log('>>>> Batch', batchNum, 'written successfully');
      })
      .catch(err => {
        console.log('XXXXXXXXXXXX Error with batch write:', err);
      });
    batchNum++;
  }
}
