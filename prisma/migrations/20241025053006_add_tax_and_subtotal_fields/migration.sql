-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "subTotal" DROP NOT NULL,
ALTER COLUMN "subTotal" DROP DEFAULT,
ALTER COLUMN "taxAmount" DROP NOT NULL,
ALTER COLUMN "taxAmount" DROP DEFAULT;
