-- Extend the existing order foundation for guest checkout without resetting data.
ALTER TABLE "Order" ADD COLUMN "checkoutToken" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "email" TEXT;
ALTER TABLE "Order" ADD COLUMN "note" TEXT;
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "subtotal" INTEGER;

UPDATE "Order"
SET
  "checkoutToken" = 'legacy-' || "id",
  "deliveryAddress" = "shippingAddress",
  "orderNumber" = 'GL-' || TO_CHAR("createdAt", 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 4)),
  "subtotal" = "totalTHB";

ALTER TABLE "Order" ALTER COLUMN "checkoutToken" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryAddress" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "contactMethod" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "shippingAddress" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "totalTHB" DROP NOT NULL;

ALTER TABLE "OrderItem" ADD COLUMN "lineTotal" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "productNameSnapshot" TEXT;

UPDATE "OrderItem" AS item
SET
  "lineTotal" = item."priceTHB" * item."quantity",
  "productNameSnapshot" = product."name"
FROM "Product" AS product
WHERE product."id" = item."productId";

ALTER TABLE "OrderItem" RENAME COLUMN "priceTHB" TO "priceSnapshot";
ALTER TABLE "OrderItem" ALTER COLUMN "lineTotal" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "productNameSnapshot" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_checkoutToken_key" ON "Order"("checkoutToken");
