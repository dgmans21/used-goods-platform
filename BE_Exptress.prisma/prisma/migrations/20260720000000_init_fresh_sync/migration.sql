-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(300) NULL,
    `pw` VARCHAR(300) NULL,
    `nickname` VARCHAR(300) NULL,
    `address` VARCHAR(300) NULL,
    `address2` VARCHAR(300) NULL,
    `point` INTEGER NULL DEFAULT 0,
    `created_at` DATE NULL,
    `updated_at` DATE NULL,
    `is_active` ENUM('Y', 'N') NULL,
    `firebase_uid` VARCHAR(128) NULL,
    `user_lat` DOUBLE NULL,
    `user_lng` DOUBLE NULL,

    UNIQUE INDEX `user_id`(`user_id`),
    UNIQUE INDEX `nickname`(`nickname`),
    UNIQUE INDEX `user_firebase_uid_key`(`firebase_uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `buyer_id` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `FK_Order_Product`(`product_id`),
    INDEX `FK_Order_Buyer`(`buyer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `FK_Product_User` FOREIGN KEY (`seller_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `FK_Order_Buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `FK_Order_Product` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
