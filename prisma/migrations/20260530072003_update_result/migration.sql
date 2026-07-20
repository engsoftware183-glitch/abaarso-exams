/*
  Warnings:

  - Made the column `final_term` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gpa` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mid_term` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_marks` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `semester_gpa` on table `Result` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "assessment_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "attendance_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "final_term" SET NOT NULL,
ALTER COLUMN "final_term" SET DEFAULT 0,
ALTER COLUMN "gpa" SET NOT NULL,
ALTER COLUMN "gpa" SET DEFAULT 0,
ALTER COLUMN "mid_term" SET NOT NULL,
ALTER COLUMN "mid_term" SET DEFAULT 0,
ALTER COLUMN "total_marks" SET NOT NULL,
ALTER COLUMN "total_marks" SET DEFAULT 0,
ALTER COLUMN "semester_gpa" SET NOT NULL,
ALTER COLUMN "semester_gpa" SET DEFAULT 0;
