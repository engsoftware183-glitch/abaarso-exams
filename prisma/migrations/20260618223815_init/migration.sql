/*
  Warnings:

  - You are about to drop the column `assignment_mark` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_mark` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `examExam_id` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `final_term` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `mid_term` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `quiz_mark` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the `Transcript` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_examExam_id_fkey";

-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_student_id_fkey";

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "assignment_mark",
DROP COLUMN "attendance_mark",
DROP COLUMN "examExam_id",
DROP COLUMN "final_term",
DROP COLUMN "mid_term",
DROP COLUMN "quiz_mark",
ADD COLUMN     "exam_id" INTEGER,
ADD COLUMN     "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "Transcript";

-- CreateTable
CREATE TABLE "StudentExam" (
    "student_exam_id" SERIAL NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "student_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExam_pkey" PRIMARY KEY ("student_exam_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentExam_student_id_exam_id_key" ON "StudentExam"("student_id", "exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("exam_id") ON DELETE SET NULL ON UPDATE CASCADE;
