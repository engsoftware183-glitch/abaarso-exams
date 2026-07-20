/*
  Warnings:

  - You are about to drop the column `credit_hour` on the `Course` table. All the data in the column will be lost.
  - Added the required column `credit_hours` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "credit_hour",
ADD COLUMN     "credit_hours" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT;
