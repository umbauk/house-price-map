const House = require('../models/house');
//const moment = require('moment');
require('dotenv').config();
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
});

exports.index = async (req, res, next) => {
  try {
    // find addresses that do not currently have coordinates in the database
    let addresses = await House.find(
      { lat: { $exists: false }, postal_code: 'Dublin 6' },
      'address',
      {
        limit: 500,
      },
    );

    for (let i = 0; i < addresses.length; i++) {
      await setTimeout(() => {
        googleMapsClient.geocode(
          {
            address: addresses[i].address,
          },
          (err, response) => {
            if (!err) {
              console.log(
                `${i + 1}: ${addresses[i].address}: ${
                  response.json.results[0].geometry.location.lat
                }, ${response.json.results[0].geometry.location.lng}`,
              );
              House.findOne({ _id: addresses[i]._id }, (err, doc) => {
                if (err) {
                  console.log(err);
                  next(err);
                } else {
                  doc.lat = response.json.results[0].geometry.location.lat;
                  doc.lng = response.json.results[0].geometry.location.lng;
                  doc.save();
                }
              });
            }
          },
        );
      }, 25);
    }
  } catch (error) {
    return next(error);
  }
};
