-- AlterTable
ALTER TABLE "UserTask" ADD COLUMN     "linkOpenedAt" TIMESTAMP(3),
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0;
