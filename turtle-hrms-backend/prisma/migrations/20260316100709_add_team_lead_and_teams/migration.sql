-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LAPTOP', 'DESKTOP', 'MONITOR', 'PHONE', 'TABLET', 'KEYBOARD', 'MOUSE', 'HEADSET', 'CHARGER', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetStatus" ADD VALUE 'MAINTENANCE';
ALTER TYPE "AssetStatus" ADD VALUE 'DISPOSED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "AttendanceStatus" ADD VALUE 'APPROVED';
ALTER TYPE "AttendanceStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeaveType" ADD VALUE 'MATERNITY';
ALTER TYPE "LeaveType" ADD VALUE 'PATERNITY';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEAM_LEAD';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "type" "AssetType" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "rejectReason" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "leave_balances" ADD COLUMN     "remaining" DOUBLE PRECISION NOT NULL DEFAULT 12,
ALTER COLUMN "allocated" SET DEFAULT 12;

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_leadId_key" ON "teams"("leadId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
