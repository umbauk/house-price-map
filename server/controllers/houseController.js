const House = require('../models/house');
//const moment = require('moment');
//require('dotenv').config();
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
        //date_of_sale: { $regex: /2010$/ },
        //postal_code: 'Dublin 14',
        //address: { $regex: /Dublin 14/i },
      },
      'address',
      {
        limit: 1000,
      },
    );

    for (let i = 0; i < addresses.length; i++) {
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
    res.send('Success');
  } catch (error) {
    return next(error);
  }
};

exports.getPrices = async (req, res, next) => {
  try {
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
      'lat lng price date_of_sale address',
    );

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
