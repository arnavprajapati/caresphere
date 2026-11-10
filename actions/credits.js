"use server";

// Replaced with Hospital Billing (No virtual credit locks required)
export async function checkAndAllocateCredits(user) {
  return { success: true };
}

export async function deductCreditsForAppointment(userId, doctorId) {
  return { success: true };
}

export async function refundCreditsForAppointment(appointmentId) {
  return { success: true };
}
