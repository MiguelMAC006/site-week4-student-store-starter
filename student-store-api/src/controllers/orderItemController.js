const OrderItem = require('../../models/orderItem');

// HTTP handlers for the top-level order-items collection. These own
// request/response concerns; database work is delegated to the OrderItem model.

// GET /order-items
async function getOrderItems(req, res) {
  try {
    const orderItems = await OrderItem.list();
    res.json(orderItems);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = {
  getOrderItems,
};
