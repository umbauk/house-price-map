const express = require('express');
const router = express.Router();
const cors = require('cors');

const houseController = require('../controllers/houseController');

router.get('/', cors(), houseController.index);
router.get(
  '/api/getPrices/:btmLeftLat/:btmLeftLng/:upperRightLat/:upperRightLng',
  cors(),
  houseController.getPrices,
);

module.exports = router;
