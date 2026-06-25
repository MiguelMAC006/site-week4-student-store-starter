const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function seed() {
  try {
    console.log('🌱 Seeding database...\n')

    // Clear existing data AND reset the autoincrement counters so ids start at
    // 1 on every seed (plain deleteMany leaves the sequence climbing). CASCADE
    // covers the FK relations between OrderItem/Order/Product.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "OrderItem", "Order", "Product" RESTART IDENTITY CASCADE;'
    )

    // Load JSON data (data/ lives alongside this script)
    const productsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8')
    )

    const ordersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/orders.json'), 'utf8')
    )

    // Seed products. Keep the explicit ids from the data file so the seeded
    // orders' product_id references resolve correctly.
    for (const product of productsData.products) {
      await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          category: product.category,
        },
      })
    }

    // Inserting products with explicit ids doesn't advance Postgres's
    // autoincrement sequence, so a later POST /products would reuse an existing
    // id and fail. Resync the sequence to MAX(id) so new inserts continue cleanly.
    await prisma.$executeRawUnsafe(
      `SELECT setval('"Product_id_seq"', (SELECT MAX(id) FROM "Product"))`
    )

    // Seed orders and items
    for (const order of ordersData.orders) {
      const createdOrder = await prisma.order.create({
        data: {
          customer_id: order.customer_id,
          email: order.email,
          total_price: order.total_price,
          status: order.status,
          created_at: new Date(order.created_at),
          order_items: {
            create: order.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      console.log(`✅ Created order #${createdOrder.order_id}`)
    }

    console.log('\n🎉 Seeding complete!')
  } catch (err) {
    console.error('❌ Error seeding:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

seed()
