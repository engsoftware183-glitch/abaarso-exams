import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// GET SINGLE NOTIFICATION
// ======================================================

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const notificationId = parseInt(id, 10);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_NOTIFICATION_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch notification");
  }
}

// ======================================================
// DELETE NOTIFICATION
// ======================================================
//
// Only SUPER_ADMIN and ADMIN may delete notifications.

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const notificationId = parseInt(id, 10);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: { notification_id: notificationId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("DELETE_NOTIFICATION_ERROR", error);
    return prismaErrorResponse(error, "Failed to delete notification");
  }
}
