/*
  Warnings:

  - You are about to drop the column `assessment_marks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_marks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `exam_id` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Result` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id,course_id,semester_id]` on the table `Result` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_exam_id_fkey";

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "assessment_marks",
DROP COLUMN "attendance_marks",
DROP COLUMN "exam_id",
DROP COLUMN "status",
ADD COLUMN     "assignment_mark" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "attendance_mark" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "examExam_id" INTEGER,
ADD COLUMN     "quiz_mark" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Result_student_id_course_id_semester_id_key" ON "Result"("student_id", "course_id", "semester_id");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examExam_id_fkey" FOREIGN KEY ("examExam_id") REFERENCES "Exam"("exam_id") ON DELETE SET NULL ON UPDATE CASCADE;
