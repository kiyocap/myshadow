-- CreateTable
CREATE TABLE "SafetyReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reportedUserName" TEXT NOT NULL,
    "threadId" TEXT,
    "messageId" TEXT,
    "reason" TEXT NOT NULL,
    "reasonLabel" TEXT NOT NULL,
    "details" TEXT,
    "appBuild" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SafetyReport_reporterId_receivedAt_idx" ON "SafetyReport"("reporterId", "receivedAt");

-- CreateIndex
CREATE INDEX "SafetyReport_reportedUserId_idx" ON "SafetyReport"("reportedUserId");

-- AddForeignKey
ALTER TABLE "SafetyReport" ADD CONSTRAINT "SafetyReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
