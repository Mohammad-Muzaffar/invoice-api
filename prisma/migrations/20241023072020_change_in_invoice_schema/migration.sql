/*
  Warnings:

  - Made the column `subTotal` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalTax` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subTotal` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalTax` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "subTotal" SET NOT NULL,
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "totalTax" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "subTotal" SET NOT NULL,
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "totalTax" SET NOT NULL;
