-- CreateTable
CREATE TABLE "activity_record" (
    "event_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "product" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "merchant_tier" TEXT NOT NULL,

    CONSTRAINT "activity_record_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "activity_record_merchant_id_idx" ON "activity_record"("merchant_id");

-- CreateIndex
CREATE INDEX "activity_record_product_idx" ON "activity_record"("product");

-- CreateIndex
CREATE INDEX "activity_record_status_idx" ON "activity_record"("status");

-- CreateIndex
CREATE INDEX "activity_record_event_timestamp_idx" ON "activity_record"("event_timestamp");
