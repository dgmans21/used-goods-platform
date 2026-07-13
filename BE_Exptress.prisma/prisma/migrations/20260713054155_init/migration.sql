-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(300) NULL,
    `pw` VARCHAR(300) NULL,
    `nickname` VARCHAR(300) NULL,
    `address` VARCHAR(300) NULL,
    `address2` VARCHAR(300) NULL,
    `point` INTEGER NULL,
    `created_at` DATE NULL,
    `updated_at` DATE NULL,
    `is_active` ENUM('Y', 'N') NULL,

    UNIQUE INDEX `user_id`(`user_id`),
    UNIQUE INDEX `nickname`(`nickname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
