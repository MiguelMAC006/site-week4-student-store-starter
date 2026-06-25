const Product = require('../../models/product');

// HTTP handlers for product endpoints. These own request/response concerns:
// reading params/body, validation, status codes, and JSON shapes. Database
// work is delegated to the Product model.

// GET /products  (optional ?category= & ?name= filters, ?sort=name|price)
async function getProducts(req, res) {
  try {
    const products = await Product.list({
      category: req.query.category,
      name: req.query.name,
      sort: req.query.sort,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// GET /products/:id
async function getProductById(req, res) {
  try {
    const product = await Product.getById(Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /products
async function createProduct(req, res) {
  try {
    const { name, description, price, image_url, category } = req.body;
    if (name === undefined) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    if (price === undefined) {
      return res.status(400).json({ error: 'Missing required field: price' });
    }
    const product = await Product.create({ name, description, price, image_url, category });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// PUT /products/:id
async function updateProduct(req, res) {
  try {
    const { name, description, price, image_url, category } = req.body;
    // Only update fields that were provided.
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (image_url !== undefined) data.image_url = image_url;
    if (category !== undefined) data.category = category;

    const product = await Product.update(Number(req.params.id), data);
    res.json(product);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// DELETE /products/:id
async function deleteProduct(req, res) {
  try {
    await Product.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
