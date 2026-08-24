import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// ======================================================
// SHARED PRISMA ERROR MAPPING
// ======================================================
//
// Maps known Prisma error codes to the correct HTTP status/message
// instead of every route collapsing all failures into a generic 500.
// Unknown/unexpected errors still fall back to 500.
//
// NOTE: with the pg driver adapter (Prisma 7), constraint violations
// surface as DriverAdapterError (code undefined) rather than the
// classic PrismaClientKnownRequestError. The postgres message patterns
// below catch those as well, so constraint handling stays consistent
// no matter which error shape the client throws.

function isForeignConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2003";
  }
  return error instanceof Error && /foreign key constraint/i.test(error.message);
}

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002";
  }
  return error instanceof Error && /duplicate key value violates unique constraint/i.test(error.message);
}

export function prismaErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

  if (isUniqueConstraintError(error)) {
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

  // P2003 / FK constraint failed. Raised when deleting a record that
  // other records still reference (e.g. deleting a Faculty that
  // Departments belong to, or an Academic Year that Semesters
  // reference). The schema uses onDelete: Restrict for academic data,
  // so this is the expected "delete blocked" path - mapped to 409
  // Conflict so the UI can explain why the delete was refused.
  if (isForeignConstraintError(error)) {
    return NextResponse.json(
      {
        success: false,
        message: "This record is in use and cannot be deleted",
      },
      {
        status: 409,
      }
    );
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
