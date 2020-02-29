const express = require('express');
const router = express.Router();
const cors = require('cors');

const houseController = require('../controllers/houseController');
const utilsController = require('../utils/addGeoHashs');

router.get('/', cors(), houseController.index);
router.get(
  '/api/getPrices/:btmLeftLat/:btmLeftLng/:upperRightLat/:upperRightLng',
  cors(),
  houseController.getPrices,
);
router.get('/api/add-geo-hashs', cors(), utilsController);

module.exports = router;
