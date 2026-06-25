const prisma = require('../src/db/db');

// Data access for the OrderItem model. Methods are thin Prisma wrappers —
// no HTTP concerns live here. OrderItems are normally created as part of an
// order's transaction (see models/order.js); these helpers support direct
// access and fetching.
class OrderItem {
  static create({ order_id, product_id, quantity, price }) {
    return prisma.orderItem.create({
      data: { order_id, product_id, quantity, price },
    });
  }

  static getById(order_item_id) {
    return prisma.orderItem.findUnique({ where: { order_item_id } });
  }

  static listByOrder(order_id) {
    return prisma.orderItem.findMany({ where: { order_id } });
  }
}

module.exports = OrderItem;
