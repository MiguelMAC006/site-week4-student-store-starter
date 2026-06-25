const Order = require('../../models/order');
const { ProductNotFoundError } = require('../../models/order');

// HTTP handlers for order endpoints. These own request/response concerns:
// reading params/body, validation, status codes, and JSON shapes. Database
// work is delegated to the Order model.

// GET /orders
async function getOrders(req, res) {
  try {
    const orders = await Order.list();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// GET /orders/:order_id
async function getOrderById(req, res) {
  try {
    const order = await Order.getById(Number(req.params.order_id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /orders — creates an order and its items in one transaction.
async function createOrder(req, res) {
  try {
    const { customer_id, status, order_items } = req.body;
    if (customer_id === undefined) {
      return res.status(400).json({ error: 'Missing required field: customer_id' });
    }
    if (!Array.isArray(order_items) || order_items.length === 0) {
      return res.status(400).json({ error: 'order_items cannot be empty' });
    }
    const order = await Order.create({ customer_id, status, order_items });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// PUT /orders/:order_id
async function updateOrder(req, res) {
  try {
    const { status } = req.body;
    const order = await Order.updateStatus(Number(req.params.order_id), status);
    res.json(order);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// DELETE /orders/:order_id
async function deleteOrder(req, res) {
  try {
    await Order.remove(Number(req.params.order_id));
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
