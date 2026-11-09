import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const ROLES = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  FRONT_DESK: "FRONT_DESK",
  PATIENT: "PATIENT",
  UNASSIGNED: "UNASSIGNED",
};

/**
 * Gets the current authenticated database user
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    return await db.user.findUnique({
      where: { clerkUserId: userId },
    });
  } catch (error) {
    console.error("Error fetching authenticated user:", error);
    return null;
  }
}

/**
 * Server-side RBAC guard for Server Components and Server Actions.
 * Throws or redirects if user is not authorized.
 * 
 * @param {string[]} allowedRoles Array of allowed role names (e.g. ['ADMIN', 'FRONT_DESK'])
 * @param {Object} options
 * @param {boolean} options.redirectOnError Whether to redirect or throw error (default: true for components)
 */
export async function requireRole(allowedRoles, options = { redirectOnError: true }) {
  const { userId } = await auth();

  if (!userId) {
    if (options.redirectOnError) {
      redirect("/sign-in");
    }
    throw new Error("UNAUTHORIZED: Sign in required");
  }

  let user;
  try {
    user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
  } catch (e) {
    console.error("Database connection error in requireRole:", e);
    if (options.redirectOnError) {
      redirect("/onboarding");
    }
    throw e;
  }

  if (!user) {
    if (options.redirectOnError) {
      redirect("/sign-in");
    }
    throw new Error("USER_NOT_FOUND: User does not exist in database");
  }

  if (user.role === ROLES.UNASSIGNED) {
    if (options.redirectOnError) {
      redirect("/onboarding");
    }
    throw new Error("ROLE_REQUIRED: Complete onboarding first");
  }

  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    if (options.redirectOnError) {
      if (user.role === ROLES.ADMIN) redirect("/admin");
      if (user.role === ROLES.DOCTOR) redirect("/doctor");
      if (user.role === ROLES.FRONT_DESK) redirect("/front-desk");
      if (user.role === ROLES.PATIENT) redirect("/appointments");
      redirect("/");
    }
    throw new Error(`FORBIDDEN: Access denied. Required: [${allowedRoles.join(", ")}], Actual: ${user.role}`);
  }

  return user;
}

/**
 * Audit Logger (Requirement: Acceptance Test #5 - Sensitive record access/edits produce audit entry)
 */
export async function createAuditLog({ action, resourceType, resourceId, details, userId }) {
  try {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const u = await db.user.findUnique({ where: { clerkUserId: clerkId } });
        effectiveUserId = u?.id;
      }
    }

    if (!effectiveUserId) return null;

    return await db.auditLog.create({
      data: {
        userId: effectiveUserId,
        action,
        resourceType,
        resourceId: String(resourceId || "N/A"),
        details: typeof details === "object" ? JSON.stringify(details) : String(details || ""),
      },
    });
  } catch (error) {
    console.error("Audit log failed to write:", error);
    return null;
  }
}
