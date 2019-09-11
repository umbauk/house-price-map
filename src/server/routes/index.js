const express = require('express');
const router = express.Router();

const house_controller = require('../controllers/houseController');

router.get('/', house_controller.index);

module.exports = router;
