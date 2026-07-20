/*
  Warnings:

  - You are about to alter the column `status` on the `product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `product` MODIFY `status` ENUM('sale', 'reserved', 'sold_out') NOT NULL DEFAULT 'sale';
