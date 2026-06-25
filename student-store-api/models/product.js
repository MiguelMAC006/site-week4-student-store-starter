const prisma = require('../src/db/db');

// Data access for the Product model. Methods are thin Prisma wrappers —
// no HTTP concerns live here (the controller handles req/res/status codes).
class Product {
  // Optional filters: category (exact match), name (case-insensitive contains).
  // Optional sort: 'name' or 'price', ascending. Unrecognized sort values are ignored.
  static list({ category, name, sort } = {}) {
    const where = {};
    if (category) where.category = category;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const query = { where };
    if (sort === 'name' || sort === 'price') {
      query.orderBy = { [sort]: 'asc' };
    }
    return prisma.product.findMany(query);
  }

  static getById(id) {
    return prisma.product.findUnique({ where: { id } });
  }

  static create(data) {
    return prisma.product.create({ data });
  }

  static update(id, data) {
    return prisma.product.update({ where: { id }, data });
  }

  static remove(id) {
    return prisma.product.delete({ where: { id } });
  }
}

module.exports = Product;
