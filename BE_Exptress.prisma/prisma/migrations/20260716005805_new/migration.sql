/*
  Warnings:

  - A unique constraint covering the columns `[firebase_uid]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `firebase_uid` VARCHAR(128) NULL,
    ADD COLUMN `user_lat` DOUBLE NULL,
    ADD COLUMN `user_lng` DOUBLE NULL;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(300) NOT NULL,
    `price` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(1000) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'sale',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `seller_id` INTEGER NOT NULL,

    INDEX `FK_Product_User`(`seller_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_firebase_uid_key` ON `user`(`firebase_uid`);

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `FK_Product_User` FOREIGN KEY (`seller_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
