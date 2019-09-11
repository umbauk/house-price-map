const House = require('../models/house');
require('dotenv').config();
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
});

exports.index = async (req, res, next) => {
  try {
    let addresses = await House.find({}, 'address', { limit: 1 });
    console.log(`addresses: ${addresses}`);

    googleMapsClient.geocode(
      {
        address: addresses[0].address,
      },
      function(err, response) {
        if (!err) {
          console.log(response.json.results[0].geometry.location.lat);
        }
      },
    );
  } catch (error) {
    return next(error);
  }
};
