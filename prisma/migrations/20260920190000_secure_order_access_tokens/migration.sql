-- Additive migration: existing orders remain intact. Legacy rows may remain
-- NULL and are assigned a token safely if revisited through checkout idempotency.
ALTER TABLE "Order" ADD COLUMN "publicAccessToken" TEXT;

CREATE UNIQUE INDEX "Order_publicAccessToken_key" ON "Order"("publicAccessToken");
