-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "stockQuantity" INTEGER,
ADD COLUMN "preorderLimit" INTEGER,
ADD COLUMN "preorderEta" DATE;
