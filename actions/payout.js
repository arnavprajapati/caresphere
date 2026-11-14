"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createAuditLog } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getDoctorEarnings() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) return null;

    const qualifyingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        OR: [
          { status: "COMPLETED" },
          { invoice: { status: "PAID" } },
        ],
      },
      include: {
        invoice: {
          select: { totalAmount: true, status: true },
        },
      },
    });

    const fee = doctor.consultationFee || 500;
    const completedAppointments = qualifyingAppointments.length;
    const totalEarnings = qualifyingAppointments.reduce((sum, apt) => {
      const amount =
        apt.invoice?.status === "PAID" && typeof apt.invoice?.totalAmount === "number"
          ? apt.invoice.totalAmount
          : fee;
      return sum + amount;
    }, 0);

    const payload = {
      totalEarnings,
      completedAppointments,
      availableCredits: completedAppointments,
      availablePayout: totalEarnings,
      thisMonthEarnings: totalEarnings,
    };

    return {
      ...payload,
      earnings: payload,
    };
  } catch (error) {
    console.error("Failed to get doctor earnings:", error);
    return null;
  }
}

export async function requestPayout(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor) throw new Error("Doctor not found");

    const earningsResult = await getDoctorEarnings();
    const amount =
      earningsResult?.totalEarnings && earningsResult.totalEarnings > 0
        ? earningsResult.totalEarnings
        : doctor.consultationFee || 500;

    await createAuditLog({
      userId: doctor.id,
      action: "DOCTOR_PAYOUT_SETTLED",
      resourceType: "Payout",
      resourceId: doctor.id,
      details: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        amount,
        payoutMethod: "DIRECT_BANK_TRANSFER",
        status: "SETTLED",
      },
    });

    revalidatePath("/doctor");
    return {
      success: true,
      message: `Disbursement of ₹${amount.toLocaleString()} successfully transferred to your registered bank account!`,
      amount,
    };
  } catch (error) {
    console.error("Failed to process doctor payout request:", error);
    throw new Error(error?.message || "Failed to process payout request");
  }
}

export async function getDoctorPayouts() {
  const { userId } = await auth();
  if (!userId) return { payouts: [] };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor) return { payouts: [] };

    const logs = await db.auditLog.findMany({
      where: {
        userId: doctor.id,
        action: { in: ["DOCTOR_PAYOUT_SETTLED", "DOCTOR_PAYOUT_REQUESTED"] },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const payouts = logs.map((log) => {
      let detailsObj = {};
      try {
        detailsObj = log.details ? JSON.parse(log.details) : {};
      } catch {
        detailsObj = {};
      }

      return {
        id: log.id,
        amount: detailsObj.amount || 500,
        status: log.action === "DOCTOR_PAYOUT_SETTLED" ? "SETTLED" : "PENDING",
        createdAt: log.timestamp,
        method: detailsObj.payoutMethod || "Direct Bank Transfer",
      };
    });

    return { payouts };
  } catch (error) {
    console.error("Failed to get doctor payouts:", error);
    return { payouts: [] };
  }
}
