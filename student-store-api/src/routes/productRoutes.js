const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Mounted at /products in server.js, so paths here are relative.
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
