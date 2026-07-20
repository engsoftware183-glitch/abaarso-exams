/*
  Warnings:

  - You are about to alter the column `phone` on the `Student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - A unique constraint covering the columns `[email]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester_id` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "email" VARCHAR(100) NOT NULL,
ADD COLUMN     "semester_id" INTEGER NOT NULL,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semester"("semester_id") ON DELETE CASCADE ON UPDATE CASCADE;
