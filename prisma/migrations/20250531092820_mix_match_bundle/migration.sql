-- DropForeignKey
ALTER TABLE `mix_match_bundles` DROP FOREIGN KEY `mix_match_bundles_shopId_fkey`;

-- AlterTable
ALTER TABLE `mix_match_bundles` ADD COLUMN `averageqty` INTEGER NULL;
