/*
  Warnings:

  - Made the column `otp` on table `Otp` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Otp" ALTER COLUMN "otp" SET NOT NULL;
