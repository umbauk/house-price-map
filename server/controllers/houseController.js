const House = require('../models/house');

exports.index = async (req, res, next) => {
  res.send(`Reached index. req = ${req}`);
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
