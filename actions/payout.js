"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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

    return {
      totalEarnings,
      completedAppointments,
      availableCredits: completedAppointments,
      availablePayout: totalEarnings,
      thisMonthEarnings: totalEarnings,
    };
  } catch (error) {
    console.error("Failed to get doctor earnings:", error);
    return null;
  }
}

export async function requestPayout() {
  return { success: true, message: "Payout request recorded" };
}

export async function getDoctorPayouts() {
  return { payouts: [] };
}
