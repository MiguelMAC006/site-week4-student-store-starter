-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT DEFAULT 'https://www.fairfaxbar.org/global_graphics/default-store-350x350.jpg',
    "category" TEXT DEFAULT 'uncategorized',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
