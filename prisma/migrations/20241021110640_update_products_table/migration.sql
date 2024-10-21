/*
  Warnings:

  - Added the required column `productId` to the `InvoiceItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `QuoteItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InvoiceItems" ADD COLUMN     "productId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuoteItems" ADD COLUMN     "productId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceItems" ADD CONSTRAINT "InvoiceItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItems" ADD CONSTRAINT "QuoteItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
