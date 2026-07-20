/*
  Warnings:

  - The values [PENDING,ARCHIVED] on the enum `ResultStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `ActivityLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `ActivityLog` table. All the data in the column will be lost.
  - The primary key for the `Admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Admin` table. All the data in the column will be lost.
  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `creditHours` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Course` table. All the data in the column will be lost.
  - The primary key for the `Department` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Department` table. All the data in the column will be lost.
  - The primary key for the `Faculty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Faculty` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Faculty` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Faculty` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Faculty` table. All the data in the column will be lost.
  - The primary key for the `Notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Notification` table. All the data in the column will be lost.
  - The primary key for the `Result` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assessmentMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `attendancePercentage` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `finalMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `gradePoint` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `midtermMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `semesterId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `totalScore` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Result` table. All the data in the column will be lost.
  - You are about to alter the column `grade` on the `Result` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - The primary key for the `Semester` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Semester` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Semester` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Semester` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Semester` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Semester` table. All the data in the column will be lost.
  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Student` table. All the data in the column will be lost.
  - The primary key for the `Transcript` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Transcript` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[course_code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[faculty_name]` on the table `Faculty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roll_no]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_code` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_name` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `credit_hour` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester_id` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_name` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_name` to the `Faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exam_id` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester_id` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_id` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester_name` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_id` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roll_no` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MIDTERM', 'FINAL');

-- AlterEnum
BEGIN;
CREATE TYPE "ResultStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."Result" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Result" ALTER COLUMN "status" TYPE "ResultStatus_new" USING ("status"::text::"ResultStatus_new");
ALTER TYPE "ResultStatus" RENAME TO "ResultStatus_old";
ALTER TYPE "ResultStatus_new" RENAME TO "ResultStatus";
DROP TYPE "public"."ResultStatus_old";
ALTER TABLE "Result" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_studentId_fkey";

-- DropIndex
DROP INDEX "Admin_userId_key";

-- DropIndex
DROP INDEX "Course_code_key";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Faculty_name_key";

-- DropIndex
DROP INDEX "Student_studentId_key";

-- DropIndex
DROP INDEX "Student_userId_key";

-- AlterTable
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "activity_id" SERIAL NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("activity_id");

-- AlterTable
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "admin_id" SERIAL NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id");

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "code",
DROP COLUMN "createdAt",
DROP COLUMN "creditHours",
DROP COLUMN "departmentId",
DROP COLUMN "id",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "course_code" VARCHAR(20) NOT NULL,
ADD COLUMN     "course_id" SERIAL NOT NULL,
ADD COLUMN     "course_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "credit_hour" INTEGER NOT NULL,
ADD COLUMN     "department_id" INTEGER NOT NULL,
ADD COLUMN     "semester_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("course_id");

-- AlterTable
ALTER TABLE "Department" DROP CONSTRAINT "Department_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "facultyId",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department_id" SERIAL NOT NULL,
ADD COLUMN     "department_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "faculty_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Department_pkey" PRIMARY KEY ("department_id");

-- AlterTable
ALTER TABLE "Faculty" DROP CONSTRAINT "Faculty_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faculty_id" SERIAL NOT NULL,
ADD COLUMN     "faculty_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Faculty_pkey" PRIMARY KEY ("faculty_id");

-- AlterTable
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notification_id" SERIAL NOT NULL,
ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id");

-- AlterTable
ALTER TABLE "Result" DROP CONSTRAINT "Result_pkey",
DROP COLUMN "assessmentMarks",
DROP COLUMN "attendanceMarks",
DROP COLUMN "attendancePercentage",
DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "finalMarks",
DROP COLUMN "gradePoint",
DROP COLUMN "id",
DROP COLUMN "midtermMarks",
DROP COLUMN "semesterId",
DROP COLUMN "studentId",
DROP COLUMN "totalScore",
DROP COLUMN "updatedAt",
ADD COLUMN     "course_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exam_id" INTEGER NOT NULL,
ADD COLUMN     "final_term" DOUBLE PRECISION,
ADD COLUMN     "gpa" DOUBLE PRECISION,
ADD COLUMN     "mid_term" DOUBLE PRECISION,
ADD COLUMN     "remarks" VARCHAR(100),
ADD COLUMN     "result_id" SERIAL NOT NULL,
ADD COLUMN     "semester_id" INTEGER NOT NULL,
ADD COLUMN     "student_id" INTEGER NOT NULL,
ADD COLUMN     "total_marks" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "grade" DROP NOT NULL,
ALTER COLUMN "grade" SET DATA TYPE VARCHAR(10),
ADD CONSTRAINT "Result_pkey" PRIMARY KEY ("result_id");

-- AlterTable
ALTER TABLE "Semester" DROP CONSTRAINT "Semester_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
DROP COLUMN "year",
ADD COLUMN     "academic_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faculty_id" INTEGER NOT NULL,
ADD COLUMN     "semester_id" SERIAL NOT NULL,
ADD COLUMN     "semester_name" VARCHAR(50) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Semester_pkey" PRIMARY KEY ("semester_id");

-- AlterTable
ALTER TABLE "Student" DROP CONSTRAINT "Student_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "departmentId",
DROP COLUMN "facultyId",
DROP COLUMN "id",
DROP COLUMN "studentId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "academic_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department_id" INTEGER NOT NULL,
ADD COLUMN     "faculty_id" INTEGER NOT NULL,
ADD COLUMN     "full_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "roll_no" VARCHAR(30) NOT NULL,
ADD COLUMN     "student_id" SERIAL NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("student_id");

-- AlterTable
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "studentId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "student_id" INTEGER NOT NULL,
ADD COLUMN     "transcript_id" SERIAL NOT NULL,
ADD CONSTRAINT "Transcript_pkey" PRIMARY KEY ("transcript_id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "Enrollment";

-- CreateTable
CREATE TABLE "Academic" (
    "academic_id" SERIAL NOT NULL,
    "year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Academic_pkey" PRIMARY KEY ("academic_id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendance_id" SERIAL NOT NULL,
    "attendance_mark" DOUBLE PRECISION NOT NULL,
    "attendance_percent" DOUBLE PRECISION NOT NULL,
    "student_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "assessment_id" SERIAL NOT NULL,
    "assignment_mark" DOUBLE PRECISION NOT NULL,
    "quiz_mark" DOUBLE PRECISION NOT NULL,
    "total_assessment" DOUBLE PRECISION NOT NULL,
    "student_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "exam_id" SERIAL NOT NULL,
    "exam_type" "ExamType" NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "room" TEXT,
    "academic_id" INTEGER NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("exam_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Academic_year_key" ON "Academic"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_user_id_key" ON "Admin"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Course_course_code_key" ON "Course"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_department_name_key" ON "Department"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_faculty_name_key" ON "Faculty"("faculty_name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_roll_no_key" ON "Student"("roll_no");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academic_id_fkey" FOREIGN KEY ("academic_id") REFERENCES "Academic"("academic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semester"("semester_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_academic_id_fkey" FOREIGN KEY ("academic_id") REFERENCES "Academic"("academic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academic_id_fkey" FOREIGN KEY ("academic_id") REFERENCES "Academic"("academic_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semester"("semester_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semester"("semester_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
