-- AlterTable
ALTER TABLE `mix_match_bundles` ADD COLUMN `discountId` VARCHAR(255) NULL,
    ADD COLUMN `shopifyApiResponse` JSON NULL;
