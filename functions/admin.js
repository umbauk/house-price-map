const functions = require('firebase-functions');
const admin = require('firebase-admin');

// config keys are set using cli: firebase functions:config:set sendgrid.key='<API_KEY>'
const DB_URL = 'https://house-price-map.firebaseio.com'; //functions.config().env.db_url;

const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DB_URL,
});

const db = admin.firestore();

module.exports = { db };
