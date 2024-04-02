const pool = require('./src/db/db');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  const client = await pool.connect();

  try {
    // Read the SQL schema file
    console.log('👋 Dropping existing tables...\n');
    await client.query('DROP TABLE IF EXISTS order_items, orders, products;');

    // Drop and recreate the tables
    console.log('🔨 Recreating tables...\n');
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);

    // Reset the sequence for the products table
    console.log('🔄 Resetting ID sequences...\n');
    await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1;');

    // Read the JSON data files
    console.log('📝 Reading JSON data files...\n');

    const productsPath = path.join(__dirname, 'data', 'products.json');
    const ordersPath = path.join(__dirname, 'data', 'orders.json');

    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));

    // Seed the products table
    console.log('🌱 Seeding products table...\n');
    for (const product of productsData.products) {
      console.log('  📦 Inserting new product:', product.name);
      await client.query(
        'INSERT INTO products (name, description, price, image_url, category) VALUES ($1, $2, $3, $4, $5);',
        [product.name, product.description, product.price, product.image_url, product.category]
      );
    }

    // Seed the orders and order_items tables
    console.log('\n🌱 Seeding orders and order_items tables...');
    for (const order of ordersData.orders) {
      console.log('\n  🛒 Inserting new order:', order.order_id);
      const { order_id, customer_id, total_price, status, created_at, items } = order;

      // Insert the order
      await client.query(
        'INSERT INTO orders (customer_id, total_price, status, created_at) VALUES ($1, $2, $3, $4);',
        [customer_id, total_price, status, created_at]
      );

      // Insert the order items
      for (const item of items) {
        console.log('    - Inserting order item for product item', item.product_id);
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4);',
          [order_id, item.product_id, item.quantity, item.price]
        );
      }
    }

    console.log('\n✅ Database seeded successfully!');
  } catch (err) {
    console.error('\n❌ Error seeding database:', err);
  } finally {
    client.release();
  }
}

seedDatabase()
  .then(() => process.exit())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
