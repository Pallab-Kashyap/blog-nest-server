/*
  Warnings:

  - A unique constraint covering the columns `[platform]` on the table `UserSocials` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[link]` on the table `UserSocials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "description" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSocials_platform_key" ON "UserSocials"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "UserSocials_link_key" ON "UserSocials"("link");
