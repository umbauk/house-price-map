const express = require('express');
const router = express.Router();
const cors = require('cors');

const house_controller = require('../controllers/houseController');

router.get('/', cors(), house_controller.index);
router.get(
  '/api/getPrices/:btmLeftLat/:btmLeftLng/:upperRightLat/:upperRightLng',
  cors(),
  house_controller.getPrices,
);

module.exports = router;
