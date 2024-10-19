/*
  Warnings:

  - Added the required column `userId` to the `Taxes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Taxes" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Taxes" ADD CONSTRAINT "Taxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
