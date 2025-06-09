/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `mix_match_bundles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sections` JSON NULL,
    `title` VARCHAR(255) NOT NULL,
    `discount_type` VARCHAR(255) NOT NULL,
    `discount_value` INTEGER NOT NULL,
    `short_description` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `media` JSON NULL,
    `start_datetime` DATETIME(0) NULL,
    `end_datetime` DATETIME(0) NULL,
    `status` VARCHAR(255) NULL,
    `json_table` JSON NULL,
    `shopId` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `mix_match_bundles_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `sessions_shop_key` ON `sessions`(`shop`);

-- AddForeignKey
ALTER TABLE `mix_match_bundles` ADD CONSTRAINT `mix_match_bundles_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `sessions`(`shop`) ON DELETE SET NULL ON UPDATE CASCADE;
