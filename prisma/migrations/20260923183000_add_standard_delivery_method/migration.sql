CREATE TYPE "DeliveryMethod" AS ENUM ('STANDARD');

ALTER TABLE "Order"
ADD COLUMN "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'STANDARD';
