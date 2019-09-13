const express = require('express');
const router = express.Router();

const house_controller = require('../controllers/houseController');

router.get('/', house_controller.index);
router.get('/populateCoords', house_controller.populateCoords);
router.get(
  '/getPrices/:btmLeftLat/:btmLeftLng/:upperRightLat/:UpperRightLng',
  house_controller.getPrices,
);

module.exports = router;
