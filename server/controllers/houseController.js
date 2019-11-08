const House = require('../models/house');
//const Bottleneck = require('bottleneck');

exports.index = async (req, res, next) => {
  res.send(`Reached index. req = ${req}`);
};

exports.getPrices = async (req, res, next) => {
  try {
    console.log('getPrices request received');

    // check lat, lng size of request is reasonable and someone isn't trying to pull whole database
    if (
      req.params.upperRightLat - req.params.btmLeftLat > 0.016 ||
      req.params.upperRightLng - req.params.btmLeftLng > 0.027
    ) {
      return next('Request area is too large');
    }

    // set limit on requests of 3 per second
    /*const limiter = new Bottleneck({
      minTime: 333,
    });*/

    //let propertyDetails = await limiter.schedule(() => House.find(
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
      },
      'lat lng price date_of_sale address',
    );
    // );

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
