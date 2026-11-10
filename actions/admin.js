"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, ROLES } from "@/lib/rbac";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    return user?.role === ROLES.ADMIN;
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

/**
 * Gets all doctors with pending verification
 */
export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin role required");

  try {
    const pendingDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "PENDING",
      },
      include: {
        _count: {
          select: { doctorAppointments: true },
        },
        ...(db.weeklyAvailability
          ? {
              weeklyAvailabilities: {
                where: { isActive: true },
                orderBy: { dayOfWeek: "asc" },
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { doctors: pendingDoctors };
  } catch (error) {
    console.error("Failed to fetch pending doctors:", error);
    return { doctors: [] };
  }
}

/**
 * Gets all verified doctors
 */
export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin role required");

  try {
    const verifiedDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      include: {
        _count: {
          select: { doctorAppointments: true },
        },
        ...(db.weeklyAvailability
          ? {
              weeklyAvailabilities: {
                where: { isActive: true },
                orderBy: { dayOfWeek: "asc" },
              },
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
    });

    return { doctors: verifiedDoctors };
  } catch (error) {
    console.error("Failed to get verified doctors:", error);
    return { doctors: [] };
  }
}

/**
 * Updates a doctor's verification status
 */
export async function updateDoctorStatus(doctorId, status) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    const updated = await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: status },
    });

    await createAuditLog({
      action: `DOCTOR_${status}`,
      resourceType: "User",
      resourceId: doctorId,
      details: { doctorName: updated.name, status },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status:", error);
    throw new Error("Unable to update doctor verification status right now. Please try again.");
  }
}

/**
 * Suspends or reinstates a doctor
 */
export async function updateDoctorActiveStatus(doctorIdOrFormData, maybeSuspend) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  let doctorId;
  let suspend;

  if (doctorIdOrFormData instanceof FormData) {
    doctorId = doctorIdOrFormData.get("doctorId");
    suspend = doctorIdOrFormData.get("suspend") === "true";
  } else {
    doctorId = doctorIdOrFormData;
    suspend = Boolean(maybeSuspend);
  }

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await db.user.update({
      where: { id: doctorId },
      data: { verificationStatus: status },
    });

    await createAuditLog({
      action: suspend ? "DOCTOR_SUSPENDED" : "DOCTOR_REINSTATED",
      resourceType: "User",
      resourceId: doctorId,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor active status:", error);
    throw new Error("Unable to update doctor account status right now. Please try again.");
  }
}

/**
 * Gets audit logs for the audit trail view (Acceptance Test #5)
 */
export async function getAuditLogs(limit = 50) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const logs = await db.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return { logs };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return { logs: [] };
  }
}

/**
 * Updates any user's role (Admin-only RBAC management)
 */
export async function updateUserRole(targetUserId, newRole) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  if (!Object.values(ROLES).includes(newRole)) {
    throw new Error("Invalid role specified");
  }

  try {
    const user = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    await createAuditLog({
      action: "USER_ROLE_CHANGED",
      resourceType: "User",
      resourceId: targetUserId,
      details: { previousRole: user.role, newRole },
    });

    revalidatePath("/admin");
    return { success: true, user };
  } catch (error) {
    console.error("Failed to change user role:", error);
    throw new Error("Unable to update user role right now. Please try again.");
  }
}

/**
 * Gets all Front-Desk staff accounts (pending, verified, and declined) for Admin review.
 */
export async function getFrontDeskStaff() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin role required");

  try {
    const staff = await db.user.findMany({
      where: { role: ROLES.FRONT_DESK },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        verificationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { staff };
  } catch (error) {
    console.error("Failed to fetch front-desk staff:", error);
    return { staff: [] };
  }
}

/**
 * Approves, rejects, or suspends a Front-Desk staff account (Admin-only).
 */
export async function updateFrontDeskStatus(staffId, status) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  if (!staffId || !["VERIFIED", "REJECTED", "PENDING"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    const updated = await db.user.update({
      where: { id: staffId, role: ROLES.FRONT_DESK },
      data: { verificationStatus: status },
    });

    await createAuditLog({
      action: `FRONT_DESK_${status}`,
      resourceType: "User",
      resourceId: staffId,
      details: { staffName: updated.name, email: updated.email, status },
    });

    revalidatePath("/admin");
    revalidatePath("/front-desk");
    revalidatePath("/front-desk-verification");
    return { success: true };
  } catch (error) {
    console.error("Failed to update front-desk status:", error);
    throw new Error("Unable to update front-desk status right now. Please try again.");
  }
}
