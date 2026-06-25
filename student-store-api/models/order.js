const prisma = require('../src/db/db');

// Thrown inside the create transaction when an order item references a product
// that doesn't exist. The controller maps this to the contract's 400 response.
class ProductNotFoundError extends Error {
  constructor(product_id) {
    super(`Product not found for product_id: ${product_id}`);
    this.name = 'ProductNotFoundError';
    this.product_id = product_id;
  }
}

// Data access for the Order model. Methods are thin Prisma wrappers —
// no HTTP concerns live here (the controller handles req/res/status codes).
class Order {
  // GET /orders returns bare orders (no items), per the API contract.
  static list() {
    return prisma.order.findMany();
  }

  static getById(order_id) {
    return prisma.order.findUnique({
      where: { order_id },
      include: { order_items: true },
    });
  }

  // Creates an Order plus all its OrderItems in a single transaction. The
  // client never sends prices — each item's price is read from the product in
  // the database and total_price is computed server-side. If any item references
  // a missing product, the whole transaction rolls back (nothing is created).
  static create({ customer_id, status, order_items }) {
    return prisma.$transaction(async (tx) => {
      const ids = order_items.map((item) => item.product_id);
      const products = await tx.product.findMany({ where: { id: { in: ids } } });
      const priceById = new Map(products.map((p) => [p.id, p.price]));

      const items = order_items.map((item) => {
        const price = priceById.get(item.product_id);
        if (price === undefined) {
          throw new ProductNotFoundError(item.product_id);
        }
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price,
        };
      });

      const total_price = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const data = { customer_id, total_price, order_items: { create: items } };
      if (status !== undefined) data.status = status;

      return tx.order.create({ data, include: { order_items: true } });
    });
  }

  static updateStatus(order_id, status) {
    return prisma.order.update({
      where: { order_id },
      data: { status },
      include: { order_items: true },
    });
  }

  static remove(order_id) {
    return prisma.order.delete({ where: { order_id } });
  }
}

module.exports = Order;
module.exports.ProductNotFoundError = ProductNotFoundError;
