const { db } = require('../admin');
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

    let housesSnapshot = await db
      .collection('house-sales')
      .where('lat', '>', parseFloat(req.params.btmLeftLat))
      .where('lat', '<', parseFloat(req.params.upperRightLat))
      .get()
      .then(snapshots => {
        console.log('Query executed');
        return Promise.resolve(snapshots);
      })
      .catch(err => {
        console.log(err);
      });

    console.log(housesSnapshot.docs.length, 'results returned');
    let viewableHouses = housesSnapshot.docs.filter(house => {
      if (
        house.get('lng') > parseFloat(req.params.btmLeftLng) &&
        house.get('lng') < parseFloat(req.params.upperRightLng)
      )
        return true;
    });

    let returnArray = viewableHouses.map(house => house.data());

    console.log(returnArray);
    return res.json({ returnArray });
  } catch (error) {
    return next(error);
  }
};
