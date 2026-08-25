import { prisma } from "@/lib/prisma";

export async function logActivity(action: string, description: string) {
  try {
    await prisma.activityLog.create({
      data: { action, description },
    });
  } catch (error) {
    console.log("ACTIVITY_LOG_WRITE_ERROR", error);
  }
}
