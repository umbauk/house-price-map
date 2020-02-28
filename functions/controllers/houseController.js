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

    let housesSnapshot = await db
      .collection('house-sales')
      .where('lng', '>', parseFloat(req.params.btmLeftLng))
      .where('lng', '<', parseFloat(req.params.upperRightLng))
      .get()
      .then(snapshots => {
        return Promise.resolve(snapshots);
      })
      .catch(err => {
        console.log(err);
      });

    let viewableHouses = housesSnapshot.docs.filter(house => {
      if (
        house.data().lat > parseFloat(req.params.btmLeftLat) &&
        house.data().lat < parseFloat(req.params.upperRightLat)
      )
        return true;
    });

    let propertyDetails = viewableHouses.map(house => house.data());

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
