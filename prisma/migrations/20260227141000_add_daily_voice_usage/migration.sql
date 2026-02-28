-- CreateTable
CREATE TABLE "DailyVoiceUsage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "secondsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyVoiceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyVoiceUsage_userId_date_idx" ON "DailyVoiceUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyVoiceUsage_userId_date_key" ON "DailyVoiceUsage"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyVoiceUsage" ADD CONSTRAINT "DailyVoiceUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
