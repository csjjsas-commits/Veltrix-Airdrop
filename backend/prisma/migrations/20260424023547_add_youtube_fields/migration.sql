-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "deadline" DATETIME,
    "taskType" TEXT NOT NULL DEFAULT 'AUTO_COMPLETE',
    "actionUrl" TEXT,
    "verificationType" TEXT,
    "verificationMethod" TEXT NOT NULL DEFAULT 'SYSTEM_AUTOMATIC',
    "platform" TEXT,
    "requiredTarget" TEXT,
    "requiredValue" TEXT,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "weekNumber" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "timeLimit" INTEGER,
    "referralTarget" TEXT,
    "requiredReferralActions" INTEGER DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verificationData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Task" ("active", "createdAt", "deadline", "description", "id", "points", "title", "updatedAt", "verificationData", "verificationType") SELECT "active", "createdAt", "deadline", "description", "id", "points", "title", "updatedAt", "verificationData", "verificationType" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "points" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "discordId" TEXT,
    "discordUsername" TEXT,
    "discordDiscriminator" TEXT,
    "discordConnectedAt" DATETIME,
    "youtubeAccessToken" TEXT,
    "youtubeRefreshToken" TEXT,
    "youtubeTokenExpiresAt" DATETIME,
    "youtubeChannelId" TEXT,
    "youtubeChannelTitle" TEXT,
    "youtubeConnectedAt" DATETIME,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "points", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "points", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
