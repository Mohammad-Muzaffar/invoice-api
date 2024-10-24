/*
  Warnings:

  - You are about to drop the column `totalWithoutTax` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithoutTax` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "totalWithoutTax",
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "totalWithoutTax",
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0;
