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

// Thrown when adding an item to an order whose order_id doesn't exist. The
// controller maps this to a 404 response.
class OrderNotFoundError extends Error {
  constructor(order_id) {
    super('Order not found');
    this.name = 'OrderNotFoundError';
    this.order_id = order_id;
  }
}

// Data access for the Order model. Methods are thin Prisma wrappers —
// no HTTP concerns live here (the controller handles req/res/status codes).
class Order {
  // GET /orders returns bare orders (no items), per the API contract.
  // Optional email filter: case-insensitive exact match. An unknown email is
  // not an error — it simply matches nothing (returns []), mirroring the
  // products filter pattern.
  static list({ email } = {}) {
    const where = {};
    if (email) where.email = { equals: email, mode: 'insensitive' };
    return prisma.order.findMany({ where });
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
  static create({ customer_id, status, email, order_items }) {
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

      const data = { customer_id, email, total_price, order_items: { create: items } };
      if (status !== undefined) data.status = status;

      return tx.order.create({ data, include: { order_items: true } });
    });
  }

  // Adds a single OrderItem to an existing order. Like POST /orders, this
  // touches two tables (creates an OrderItem and bumps the parent order's
  // total_price), so it runs in one transaction — either both succeed or
  // neither does. The price is read from the product in the database (never
  // trusted from the client) and total_price is incremented by price × quantity.
  static addItem(order_id, { product_id, quantity = 1 }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { order_id } });
      if (!order) {
        throw new OrderNotFoundError(order_id);
      }

      const product = await tx.product.findUnique({ where: { id: product_id } });
      if (!product) {
        throw new ProductNotFoundError(product_id);
      }

      const item = await tx.orderItem.create({
        data: { order_id, product_id, quantity, price: product.price },
      });

      await tx.order.update({
        where: { order_id },
        data: { total_price: { increment: product.price * quantity } },
      });

      return item;
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
module.exports.OrderNotFoundError = OrderNotFoundError;
