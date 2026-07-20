/*
  Warnings:

  - Added the required column `updated_at` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "assignment_mark" SET DEFAULT 0,
ALTER COLUMN "quiz_mark" SET DEFAULT 0,
ALTER COLUMN "total_assessment" SET DEFAULT 0;
