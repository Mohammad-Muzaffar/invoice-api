-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "refreshTokenExpiresAt" DROP NOT NULL;
