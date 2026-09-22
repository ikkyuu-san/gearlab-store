ALTER TABLE "Product"
ADD COLUMN "brand" TEXT,
ADD COLUMN "sku" TEXT,
ADD COLUMN "imageAlt" TEXT,
ADD COLUMN "imageStorageKey" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
