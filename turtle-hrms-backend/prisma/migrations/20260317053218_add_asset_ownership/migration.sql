-- CreateEnum
CREATE TYPE "AssetOwnership" AS ENUM ('COMPANY_OWNED', 'RENTED', 'LEASED');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "ownership" "AssetOwnership" NOT NULL DEFAULT 'COMPANY_OWNED';
