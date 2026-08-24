import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prismaErrorResponse } from "@/lib/errors";

// ======================================================
// LIST NOTIFICATIONS
// ======================================================
//
// Notifications are broadcast-style (no recipient field in the
// current schema), so every authenticated user sees the same
// global feed. SUPER_ADMIN / ADMIN / STUDENT are all allowed.

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));

    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET_NOTIFICATIONS_ERROR", error);
    return prismaErrorResponse(error, "Failed to fetch notifications");
  }
}

// ======================================================
// CREATE NOTIFICATION
// ======================================================
//
// Only SUPER_ADMIN and ADMIN may create notifications.
// Uses only schema-supported fields: title and message.

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req, ["SUPER_ADMIN", "ADMIN"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title: String(title),
        message: String(message),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification created",
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("CREATE_NOTIFICATION_ERROR", error);
    return prismaErrorResponse(error, "Failed to create notification");
  }
}
