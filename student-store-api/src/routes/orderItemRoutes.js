const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');

// Mounted at /order-items in server.js, so paths here are relative.
router.get('/', orderItemController.getOrderItems);

module.exports = router;
