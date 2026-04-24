-- AlterTable
ALTER TABLE "User" ADD COLUMN "twitterAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "twitterConnectedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "twitterRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "twitterTokenExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "twitterUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "twitterUsername" TEXT;
