"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/rbac";

/**
 * Set doctor's availability slots
 */
export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
    });

    if (existingSlots.length > 0) {
      // Preserve slots that already have appointments linked
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithNoAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithNoAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }

    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    revalidatePath("/front-desk");
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Failed to set availability slots:", error);
    throw new Error("Unable to save availability slots right now. Please try again.");
  }
}

/**
 * Get doctor's current availability slots
 */
export async function getDoctorAvailability() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Please sign in to view your availability.");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      return { slots: [], weeklySchedule: [], overrides: [] };
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const [availabilitySlots, weeklySchedule, overrides] = await Promise.all([
      db.availability.findMany({
        where: {
          doctorId: doctor.id,
        },
        orderBy: {
          startTime: "asc",
        },
      }),
      db.weeklyAvailability
        ? db.weeklyAvailability.findMany({
            where: {
              doctorId: doctor.id,
            },
            orderBy: {
              dayOfWeek: "asc",
            },
          })
        : Promise.resolve([]),
      db.availabilityOverride
        ? db.availabilityOverride.findMany({
            where: {
              doctorId: doctor.id,
              date: { gte: todayStr },
            },
            orderBy: {
              date: "asc",
            },
          })
        : Promise.resolve([]),
    ]);

    return { slots: availabilitySlots, weeklySchedule, overrides };
  } catch (error) {
    console.error("Failed to fetch availability slots:", error);
    return {
      slots: [],
      weeklySchedule: [],
      overrides: [],
      error: "Unable to load availability settings right now. Please refresh to try again.",
    };
  }
}

/**
 * Save recurring weekly availability schedule (Mon-Sun)
 */
export async function saveWeeklyAvailability(scheduleItems) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!Array.isArray(scheduleItems) || scheduleItems.length === 0) {
    throw new Error("Weekly schedule items are required");
  }

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  for (const item of scheduleItems) {
    const day = Number(item.dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error("Invalid day of week");
    }
    if (item.isActive) {
      if (!timePattern.test(item.startTime) || !timePattern.test(item.endTime)) {
        throw new Error("Valid start and end times (HH:mm) are required for active days");
      }
      if (item.startTime >= item.endTime) {
        throw new Error("Start time must be before end time for all active days");
      }
    }
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const updated = await db.$transaction(async (tx) => {
      return await Promise.all(
        scheduleItems.map((item) =>
          tx.weeklyAvailability.upsert({
            where: {
              doctorId_dayOfWeek: {
                doctorId: doctor.id,
                dayOfWeek: Number(item.dayOfWeek),
              },
            },
            update: {
              isActive: Boolean(item.isActive),
              startTime: item.startTime || "09:00",
              endTime: item.endTime || "17:00",
            },
            create: {
              doctorId: doctor.id,
              dayOfWeek: Number(item.dayOfWeek),
              isActive: Boolean(item.isActive),
              startTime: item.startTime || "09:00",
              endTime: item.endTime || "17:00",
            },
          })
        )
      );
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    revalidatePath("/front-desk");
    return { success: true, weeklySchedule: updated };
  } catch (error) {
    console.error("Failed to save weekly availability:", error);
    throw new Error("Unable to save your weekly schedule right now. Please try again.");
  }
}

/**
 * Set a specific calendar date override (custom hours or mark date unavailable)
 */
export async function setDateAvailabilityOverride({
  date,
  isBlocked = false,
  startTime = null,
  endTime = null,
  reason = null,
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("A valid calendar date (YYYY-MM-DD) is required");
  }

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!isBlocked) {
    if (!timePattern.test(startTime || "") || !timePattern.test(endTime || "")) {
      throw new Error("Valid start and end times are required");
    }
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const override = await db.availabilityOverride.upsert({
      where: {
        doctorId_date: {
          doctorId: doctor.id,
          date,
        },
      },
      update: {
        isBlocked: Boolean(isBlocked),
        startTime: isBlocked ? null : startTime,
        endTime: isBlocked ? null : endTime,
        reason: reason?.trim() || null,
      },
      create: {
        doctorId: doctor.id,
        date,
        isBlocked: Boolean(isBlocked),
        startTime: isBlocked ? null : startTime,
        endTime: isBlocked ? null : endTime,
        reason: reason?.trim() || null,
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    revalidatePath("/front-desk");
    return { success: true, override };
  } catch (error) {
    console.error("Failed to set date override:", error);
    throw new Error("Unable to save this date setting right now. Please try again.");
  }
}

/**
 * Delete a calendar date override (reverts that date back to weekly default)
 */
export async function deleteDateAvailabilityOverride(overrideId) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!overrideId) {
    throw new Error("Override ID is required");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    await db.availabilityOverride.deleteMany({
      where: {
        id: overrideId,
        doctorId: doctor.id,
      },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    revalidatePath("/front-desk");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove date override:", error);
    throw new Error("Unable to remove this date setting right now. Please try again.");
  }
}

/**
 * Get doctor's upcoming appointments
 */

export async function getDoctorAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ["SCHEDULED", "IN_PROGRESS"],
        },
      },
      include: {
        patient: true,
        visitRecord: {
          select: {
            id: true,
            clinicianNotes: true,
            diagnosis: true,
            symptoms: true,
            followUpDate: true,
            updatedAt: true,
            prescriptions: {
              orderBy: { createdAt: "asc" },
            },
            ...(db.diagnosticReport
              ? {
                  diagnosticReports: {
                    orderBy: { createdAt: "asc" },
                  },
                }
              : {}),
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to fetch doctor appointments:", error);
    return { appointments: [], error: "Unable to load appointments right now." };
  }
}

/**
 * Cancel an appointment (can be done by both doctor and patient)
 */
export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const isStaffManager =
      (user.role === "FRONT_DESK" && user.verificationStatus === "VERIFIED") ||
      user.role === "ADMIN";
    if (
      appointment.doctorId !== user.id &&
      appointment.patientId !== user.id &&
      !isStaffManager
    ) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("This appointment is already cancelled");
    }
    if (appointment.status === "COMPLETED") {
      throw new Error("Completed appointments cannot be cancelled");
    }

    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
          description: `Refund for cancelled appointment ${appointment.id}`,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
          description: `Deduction for cancelled appointment ${appointment.id}`,
        },
      });

      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });
    });

    await createAuditLog({
      action: "CANCEL_APPOINTMENT",
      resourceType: "Appointment",
      resourceId: appointment.id,
      details: {
        cancelledByRole: user.role,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
      userId: user.id,
    });

    revalidatePath("/doctor");
    revalidatePath("/appointments");
    revalidatePath("/front-desk");

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    const knownSafe = [
      "Unauthorized",
      "User not found",
      "Appointment ID is required",
      "Appointment not found",
      "You are not authorized to cancel this appointment",
      "This appointment is already cancelled",
      "Completed appointments cannot be cancelled",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to cancel this appointment right now. Please try again."
    );
  }
}

/**
 * Add or update clinician notes in VisitRecord for a doctor's appointment
 */
export async function addAppointmentNotes(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = String(formData.get("appointmentId") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!appointmentId || !notes) {
      throw new Error("Appointment ID and notes are required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("Cannot add clinical notes to a cancelled appointment");
    }

    // Persist clinical notes on the linked VisitRecord (preserving symptoms/diagnosis)
    const visitRecord = await db.visitRecord.upsert({
      where: {
        appointmentId: appointment.id,
      },
      update: {
        clinicianNotes: notes,
      },
      create: {
        appointmentId: appointment.id,
        doctorId: doctor.id,
        clinicianNotes: notes,
      },
    });

    await createAuditLog({
      action: "UPDATE_APPOINTMENT_NOTES",
      resourceType: "VisitRecord",
      resourceId: visitRecord.id,
      details: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
      },
      userId: doctor.id,
    });

    revalidatePath("/doctor");
    revalidatePath("/appointments");
    return {
      success: true,
      visitRecord,
      notes: visitRecord.clinicianNotes,
    };
  } catch (error) {
    console.error("Failed to add appointment notes:", error);
    const knownSafe = [
      "Unauthorized",
      "Doctor not found",
      "Appointment ID and notes are required",
      "Appointment not found",
      "Cannot add clinical notes to a cancelled appointment",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to save appointment notes right now. Please try again."
    );
  }
}

/**
 * Mark an appointment as completed (only by doctor after end time)
 */
export async function markAppointmentCompleted(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: true,
        visitRecord: {
          select: {
            id: true,
            clinicianNotes: true,
            diagnosis: true,
            symptoms: true,
            followUpDate: true,
            updatedAt: true,
            prescriptions: {
              orderBy: { createdAt: "asc" },
            },
            ...(db.diagnosticReport
              ? {
                  diagnosticReports: {
                    orderBy: { createdAt: "asc" },
                  },
                }
              : {}),
          },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found or not authorized");
    }

    if (!["SCHEDULED", "IN_PROGRESS"].includes(appointment.status)) {
      throw new Error("Only scheduled or checked-in appointments can be marked as completed");
    }

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time"
      );
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "COMPLETED",
      },
    });

    revalidatePath("/doctor");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to mark appointment as completed:", error);
    const knownSafe = [
      "Only scheduled appointments can be marked as completed",
      "Only scheduled or checked-in appointments can be marked as completed",
      "Cannot mark appointment as completed before the scheduled end time",
      "Appointment not found or not authorized",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to mark this appointment as completed right now. Please try again."
    );
  }
}

/**
 * Update doctor's consultation fee and description
 */
export async function updateDoctorConsultationFee(fee) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const numFee = parseFloat(fee);
  if (isNaN(numFee) || numFee < 0) {
    throw new Error("Please enter a valid consultation fee amount");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor profile not found");
    }

    const updated = await db.user.update({
      where: { id: doctor.id },
      data: { consultationFee: numFee },
    });

    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    revalidatePath("/front-desk");
    return { success: true, consultationFee: updated.consultationFee };
  } catch (error) {
    console.error("Failed to update consultation fee:", error);
    throw new Error("Unable to update consultation fee right now. Please try again.");
  }
}
