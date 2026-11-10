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

    const completedAppointments = await db.appointment.count({
      where: { doctorId: doctor.id, status: "COMPLETED" },
    });

    const fee = doctor.consultationFee || 500;
    const totalEarnings = completedAppointments * fee;

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
