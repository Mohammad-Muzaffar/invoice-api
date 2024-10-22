/*
  Warnings:

  - Added the required column `totalWithoutTax` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxableAmount` to the `InvoiceItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `InvoiceItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWithoutTax` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxableAmount` to the `QuoteItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `QuoteItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cgst" INTEGER,
ADD COLUMN     "gst" INTEGER,
ADD COLUMN     "igst" INTEGER,
ADD COLUMN     "sgst" INTEGER,
ADD COLUMN     "totalWithoutTax" INTEGER NOT NULL,
ALTER COLUMN "subTotal" DROP NOT NULL,
ALTER COLUMN "discount" DROP NOT NULL,
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "totalTax" DROP NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItems" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxableAmount" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "cgst" INTEGER,
ADD COLUMN     "gst" INTEGER,
ADD COLUMN     "igst" INTEGER,
ADD COLUMN     "sgst" INTEGER,
ADD COLUMN     "totalWithoutTax" INTEGER NOT NULL,
ALTER COLUMN "subTotal" DROP NOT NULL,
ALTER COLUMN "discount" DROP NOT NULL,
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "totalTax" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuoteItems" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxableAmount" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" INTEGER NOT NULL;
