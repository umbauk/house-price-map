const { db } = require('../admin');

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

    let viewableHouses = await db
      .collection('house-sales')
      .where('lat', '>', parseFloat(req.params.btmLeftLat))
      .where('lat', '<', parseFloat(req.params.upperRightLat))
      .select('lat', 'lng', 'address', 'date_of_sale', 'price')
      .get()
      .then(snapshots => {
        let viewableHouses = snapshots.docs.filter(house => {
          if (
            house.data().lng > parseFloat(req.params.btmLeftLng) &&
            house.data().lng < parseFloat(req.params.upperRightLng)
          )
            return true;
        });
        return Promise.resolve(viewableHouses);
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
