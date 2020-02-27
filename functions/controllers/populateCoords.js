if (!process.env.MONGO_DB_URL) require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

let mongoDB = process.env.MONGO_DB_URL;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

const House = require('../models/house');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
});

populateCoords = async () => {
  try {
    // find addresses that do not currently have coordinates in the database
    let addresses = await House.find(
      {
        lat: { $exists: true },
        //date_of_sale: { $regex: /2010$/ },
        //postal_code: 'Dublin 14',
        //address: { $regex: /Dublin 14/i },
      },
      'address',
      {
        limit: 1,
      },
    );

    for (let i = 0; i < addresses.length; i++) {
      // Request coordinates for addresses from Google Maps
      await googleMapsClient.geocode(
        {
          address: addresses[i].address,
        },
        (err, response) => {
          if (err) {
            console.log(err);
          } else {
            House.findOne({ _id: addresses[i]._id }, (err, doc) => {
              if (err) {
                console.log(err);
                next(err);
              } else if (response.json.status !== 'OK') {
                console.log(`ERROR: ${response.json.status} - ${addresses[i].address}`);
                if (response.json.status === 'ZERO_RESULTS') {
                  console.log(`${i + 1}: ${addresses[i].address}: ${response.json.status}`);
                  doc.lat = 0;
                  doc.lng = 0;
                  doc.save();
                }
              } else {
                console.log(
                  `${i + 1}: ${addresses[i].address}: ${
                    response.json.results[0].geometry.location.lat
                  }, ${response.json.results[0].geometry.location.lng}`,
                );
                doc.lat = response.json.results[0].geometry.location.lat;
                doc.lng = response.json.results[0].geometry.location.lng;
                doc.save();
              }
            });
          }
        },
      );
    }
    console.log('Success');
  } catch (error) {
    console.error(error);
  }
};

populateCoords();
