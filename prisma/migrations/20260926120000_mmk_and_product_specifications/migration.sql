-- Preserve existing product and order amounts without converting their numeric values.
ALTER TABLE "Product" RENAME COLUMN "priceTHB" TO "priceMMK";
ALTER TABLE "Order" RENAME COLUMN "totalTHB" TO "totalAmount";

-- Existing orders remain marked as THB; newly created orders explicitly use MMK.
CREATE TYPE "OrderCurrency" AS ENUM ('MMK', 'THB');
ALTER TABLE "Order" ADD COLUMN "currency" "OrderCurrency" NOT NULL DEFAULT 'THB';

CREATE TABLE "ProductSpecification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductSpecification_productId_position_idx"
    ON "ProductSpecification"("productId", "position");

ALTER TABLE "ProductSpecification"
    ADD CONSTRAINT "ProductSpecification_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
