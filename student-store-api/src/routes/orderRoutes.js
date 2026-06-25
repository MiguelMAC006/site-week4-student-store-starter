const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Mounted at /orders in server.js, so paths here are relative.
router.get('/', orderController.getOrders);
router.get('/:order_id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.post('/:order_id/items', orderController.addOrderItem);
router.put('/:order_id', orderController.updateOrder);
router.delete('/:order_id', orderController.deleteOrder);

module.exports = router;
