CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
