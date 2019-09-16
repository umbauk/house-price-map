const House = require('../models/house');
//const moment = require('moment');
require('dotenv').config();
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
});

exports.index = async (req, res, next) => {
  res.send(`Reached index. req = ${req}`);
};

exports.populateCoords = async (req, res, next) => {
  try {
    // find addresses that do not currently have coordinates in the database
    let addresses = await House.find(
      {
        lat: { $exists: false },
        postal_code: '',
        address: { $regex: /Dublin 6/i },
      },
      'address',
      {
        limit: 1000,
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
                  doc.postal_code = 'Dublin 6';
                  doc.save();
                }
              });
            }
          },
        );
      }, 25);
    }
    res.send('Success');
  } catch (error) {
    return next(error);
  }
};

exports.getPrices = async (req, res, next) => {
  try {
    // http://localhost:3001/getPrices/53.302753042851606/-6.291490458019325/53.3067535745927/-6.2870111689644546
    console.log('getPrices request received');
    let propertyDetails = await House.find(
      {
        // only return addresses that are viewable in current map bounds
        lat: {
          $exists: true,
          $gt: req.params.btmLeftLat,
          $lt: req.params.upperRightLat,
        },
        lng: {
          $exists: true,
          $gt: req.params.btmLeftLng,
          $lt: req.params.upperRightLng,
        },
        //postal_code: { $in: ['Dublin 6', 'Dublin 6w'] },
      },
      'lat lng price',
    );

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
