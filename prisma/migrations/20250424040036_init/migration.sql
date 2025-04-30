/*
  Warnings:

  - Added the required column `updatedAt` to the `PostStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Save` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Upvote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserSocials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostStats" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Save" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Upvote" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserSocials" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
