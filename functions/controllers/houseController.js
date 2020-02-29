const { db } = require('../admin');
const geoHash = require('ngeohash');

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

    let lower = geoHash.encode(req.params.btmLeftLat, req.params.btmLeftLng);
    let upper = geoHash.encode(req.params.upperRightLat, req.params.upperRightLng);
    let hashArea = { lower, upper };

    let viewableHouses = await db
      .collection('house-sales')
      .where('geoHash', '>=', hashArea.lower)
      .where('geoHash', '<=', hashArea.upper)
      .select('lat', 'lng', 'address', 'date_of_sale', 'price')
      .get()
      .then(snapshot => {
        return snapshot.docs;
      })
      .catch(err => {
        console.log(err);
      });

    let propertyDetails = viewableHouses.map(house => house.data());

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
