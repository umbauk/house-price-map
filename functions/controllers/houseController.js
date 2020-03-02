const { db } = require('../admin');
const geoHash = require('ngeohash');

exports.index = async (req, res, next) => {
  res.send(`Reached index. req = ${req}`);
};

exports.getPrices = async (req, res, next) => {
  try {
    console.log('getPrices request received');
    let upperLat = parseFloat(req.params.upperRightLat);
    let lowerLat = parseFloat(req.params.btmLeftLat);
    let upperLng = parseFloat(req.params.upperRightLng);
    let lowerLng = parseFloat(req.params.btmLeftLng);

    // check lat, lng size of request is reasonable and someone isn't trying to pull whole database
    if (upperLat - lowerLat > 0.016 || upperLng - lowerLng > 0.027) {
      return next('Request area is too large');
    }

    let boundaryBoxesArr = geoHash.bboxes(lowerLat, lowerLng, upperLat, upperLng, 7);
    console.log('Boundary box:', boundaryBoxesArr);

    let returnDocuments = [];

    await Promise.all(
      boundaryBoxesArr.map(async box => {
        let results = await db
          .collection('house-sales')
          .orderBy('geoHash')
          .startAt(box)
          .endAt(box + '~')
          .select('lat', 'lng', 'address', 'date_of_sale', 'price')
          .get()
          .then(snapshot => {
            return snapshot.docs;
          })
          .catch(err => {
            console.log(err);
          });
        returnDocuments.push(...results);
        Promise.resolve();
      }),
    );

    console.log(returnDocuments.length, 'results returned');

    let propertyDetails = returnDocuments.map(doc => doc.data());

    return res.json({ propertyDetails });
  } catch (error) {
    return next(error);
  }
};
