import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function VerifyTranscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ student_id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { student_id } = await params;
  const { token } = await searchParams;

  const studentId = parseInt(student_id, 10);
  if (isNaN(studentId)) {
    return notFound();
  }

  // Verify the HMAC token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E5E7EB] max-w-md w-full text-center">
           <Image src="/images/atu-logo.jpg" alt="ATU Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#90274F]">ABAARSO TECH UNIVERSITY</h1>
          <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-bold text-red-700">Verification Unavailable</h2>
            <p className="text-sm text-red-600 mt-1">The verification service is not configured.</p>
          </div>
        </div>
      </div>
    );
  }
  const expectedToken = crypto.createHmac("sha256", secret).update(studentId.toString()).digest("hex").substring(0, 16);

  if (!token || token.length !== expectedToken.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E5E7EB] max-w-md w-full text-center">
           <Image src="/images/atu-logo.jpg" alt="ATU Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#90274F]">ABAARSO TECH UNIVERSITY</h1>
          <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-bold text-red-700">Not Verified</h2>
            <p className="text-sm text-red-600 mt-1">Invalid or forged verification link.</p>
          </div>
          <p className="text-xs text-[#6B7280]">Checked at {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  }

  const student = await prisma.student.findUnique({
    where: { student_id: studentId },
    include: {
      faculty: true,
      academic: true,
      results: {
        where: { status: "PUBLISHED" },
      },
    }
  });

  if (!student || student.results.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E5E7EB] max-w-md w-full text-center">
           <Image src="/images/atu-logo.jpg" alt="ATU Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#90274F]">ABAARSO TECH UNIVERSITY</h1>
          <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-bold text-red-700">Not Verified</h2>
            <p className="text-sm text-red-600 mt-1">No official transcript records found.</p>
          </div>
          <p className="text-xs text-[#6B7280]">Checked at {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-[#E5E7EB] max-w-md w-full text-center">
         <Image src="/images/atu-logo.jpg" alt="ATU Logo" width={80} height={80} className="mx-auto mb-4" />
        <h1 className="text-xl font-black text-[#90274F]">ABAARSO TECH UNIVERSITY</h1>
        <div className="my-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-bold text-green-700">Transcript Verified</h2>
          <p className="text-sm text-green-600 mt-1">This is a valid and official academic record.</p>
        </div>
        
        <div className="text-left space-y-3 mb-6 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Student Name</p>
            <p className="text-sm font-semibold text-[#111827]">{student.full_name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Roll Number</p>
            <p className="text-sm font-semibold text-[#111827]">{student.roll_no}</p>
          </div>
          {student.faculty && (
            <div>
              <p className="text-xs font-bold text-[#6B7280]">Faculty</p>
              <p className="text-sm font-semibold text-[#111827]">{student.faculty.faculty_name}</p>
            </div>
          )}
          {student.academic && (
            <div>
              <p className="text-xs font-bold text-[#6B7280]">Academic Year</p>
              <p className="text-sm font-semibold text-[#111827]">{student.academic.year}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Published Results</p>
            <p className="text-sm font-semibold text-[#111827]">{student.results.length} courses</p>
          </div>
        </div>
        
        <p className="text-xs text-[#6B7280]">Checked at {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
