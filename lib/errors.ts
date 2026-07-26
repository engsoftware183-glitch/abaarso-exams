import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// ======================================================
// SHARED PRISMA ERROR MAPPING
// ======================================================
//
// Maps known Prisma error codes to the correct HTTP status/message
// instead of every route collapsing all failures into a generic 500.
// Unknown/unexpected errors still fall back to 500.

export function prismaErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A record with this value already exists",
        },
        {
          status: 409,
        }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "Record not found",
        },
        {
          status: 404,
        }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
    },
    {
      status: 500,
    }
  );
}
