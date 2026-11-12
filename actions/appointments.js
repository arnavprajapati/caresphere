"use server";

import crypto from "crypto";
import fs from "fs";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/rbac";
import { Vonage } from "@vonage/server-sdk";
import { addDays, addMinutes, format, isBefore, endOfDay } from "date-fns";
import { Auth } from "@vonage/auth";
import { MediaMode } from "@vonage/video";
import {
  getClinicDateString,
  addDaysToDateString,
  getClinicDayOfWeekFromDateStr,
  getClinicDayOfWeek,
  formatClinicDateStr,
  clinicTimeToUtcDate,
  formatInClinicTz,
  formatTime12h,
  addMinutesToHHMM,
} from "@/lib/date-utils";

/**
 * Resolves a Vonage private key from an env var (PEM text, escaped-\n PEM, or file path)
 * and verifies it is a valid asymmetric private key before initializing the SDK.
 */
function resolveValidPrivateKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return null;
  const trimmed = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return null;

  let keyMaterial = trimmed;
  if (!trimmed.includes("-----BEGIN") && fs.existsSync(trimmed)) {
    try {
      keyMaterial = fs.readFileSync(trimmed, "utf8");
    } catch {
      return null;
    }
  } else {
    keyMaterial = trimmed.replace(/\\n/g, "\n");
  }

  if (!keyMaterial.includes("-----BEGIN")) {
    return null;
  }

  try {
    crypto.createPrivateKey(keyMaterial);
    return keyMaterial;
  } catch {
    return null;
  }
}

/**
 * Initializes the Vonage Video client for @vonage/server-sdk v3.x.
 * Returns null cleanly when credentials are missing or not a valid Vonage App/PEM key.
 */
function getVonageVideoClient() {
  const applicationId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID?.trim();
  const privateKey = resolveValidPrivateKey(process.env.VONAGE_PRIVATE_KEY);

  if (!applicationId || !privateKey) {
    return null;
  }

  try {
    const credentials = new Auth({ applicationId, privateKey });
    const client = new Vonage(credentials, {});
    if (!client?.video || typeof client.video.createSession !== "function") {
      return null;
    }
    return client.video;
  } catch (error) {
    console.warn("Vonage client initialization failed:", error.message);
    return null;
  }
}

/**
 * Shared overlap check inside an interactive transaction to prevent double-booking.
 */
async function findOverlappingAppointment(
  tx,
  { doctorId, startTime, endTime, excludeAppointmentId = null }
) {
  return await tx.appointment.findFirst({
    where: {
      doctorId,
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });
}

/**
 * Book a new appointment with a doctor.
 * Concurrency protected (Acceptance Test #2).
 * Automatically generates Invoice (Acceptance Test #4) and Audit Log (Acceptance Test #5).
 */
export async function bookAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: Sign in required");
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) {
      throw new Error("User not found in system");
    }

    const doctorId = formData.get("doctorId");
    const startTime = new Date(formData.get("startTime"));
    const endTime = new Date(formData.get("endTime"));
    const patientDescription =
      formData.get("patientDescription") || formData.get("description") || null;
    const requestedPatientId = formData.get("patientId");

    // Determine target patient ID strictly by caller role:
    // - PATIENT can only book for themselves (never spoof another patientId).
    // - FRONT_DESK / ADMIN must explicitly select an existing PATIENT record (never themselves).
    let patientId = null;
    if (currentUser.role === "PATIENT") {
      patientId = currentUser.id;
    } else if (
      (currentUser.role === "FRONT_DESK" &&
        currentUser.verificationStatus === "VERIFIED") ||
      currentUser.role === "ADMIN"
    ) {
      if (!requestedPatientId) {
        throw new Error("Please select or register a patient before booking an appointment.");
      }

      const targetPatient = await db.user.findUnique({
        where: { id: String(requestedPatientId) },
        select: { id: true, role: true },
      });

      if (!targetPatient || targetPatient.role !== "PATIENT") {
        throw new Error("Selected patient account was not found.");
      }

      patientId = targetPatient.id;
    } else {
      throw new Error("Only patients, front-desk staff, or admins can book appointments.");
    }

    if (!doctorId || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Doctor, start time, and end time are required");
    }

    const now = new Date();
    if (endTime <= startTime) {
      throw new Error("Invalid appointment time range.");
    }
    if (startTime <= now) {
      throw new Error(
        "Cannot book an appointment in the past. Please select an upcoming time slot."
      );
    }

    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    // Create Vonage video session when valid credentials are configured;
    // never fabricate a fake session ID if initialization or API creation fails.
    const videoResult = await createVideoSession();
    const videoSessionId = videoResult.ok ? videoResult.sessionId : null;

    const consultationFee = doctor.consultationFee || 500;
    const bookingDateStr = formatInClinicTz(startTime, "yyyy-MM-dd");

    // Concurrency Protection: Interactive Transaction
    const result = await db.$transaction(async (tx) => {
      const blockedOverride = tx.availabilityOverride
        ? await tx.availabilityOverride.findUnique({
            where: {
              doctorId_date: {
                doctorId,
                date: bookingDateStr,
              },
            },
          })
        : null;

      if (blockedOverride?.isBlocked) {
        throw new Error("Doctor is unavailable on the selected date.");
      }

      const overlapping = await findOverlappingAppointment(tx, {
        doctorId,
        startTime,
        endTime,
      });

      if (overlapping) {
        throw new Error("CONFLICT: This time slot has already been booked by another patient.");
      }

      const appointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          startTime,
          endTime,
          patientDescription,
          videoSessionId,
          status: "SCHEDULED",
        },
      });

      await tx.availability.updateMany({
        where: {
          doctorId,
          startTime: { lte: startTime },
          endTime: { gte: endTime },
        },
        data: { status: "BOOKED" },
      });

      const invoice = await tx.invoice.create({
        data: {
          patientId,
          appointmentId: appointment.id,
          totalAmount: consultationFee,
          status: "UNPAID",
          lineItems: {
            create: [
              {
                description: `Doctor Consultation - Dr. ${doctor.name} (${doctor.specialty || "General"})`,
                unitPrice: consultationFee,
                quantity: 1,
                amount: consultationFee,
              },
            ],
          },
        },
      });

      return { appointment, invoice };
    });

    await createAuditLog({
      action: "BOOK_APPOINTMENT",
      resourceType: "Appointment",
      resourceId: result.appointment.id,
      details: { doctorId, patientId, startTime },
      userId: currentUser.id,
    });

    revalidatePath("/appointments");
    revalidatePath("/front-desk");
    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");
    return {
      success: true,
      appointment: result.appointment,
      videoSessionReady: Boolean(videoSessionId),
      videoWarning: videoResult.ok ? null : videoResult.reason,
    };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    if (error?.code === "P2002") {
      throw new Error(
        "CONFLICT: This time slot has already been booked by another patient."
      );
    }
    const knownSafe = [
      "Unauthorized: Sign in required",
      "User not found in system",
      "Please select or register a patient before booking an appointment.",
      "Selected patient account was not found.",
      "Only patients, front-desk staff, or admins can book appointments.",
      "Doctor, start time, and end time are required",
      "Invalid appointment time range.",
      "Cannot book an appointment in the past. Please select an upcoming time slot.",
      "Doctor not found or not verified",
      "Doctor is unavailable on the selected date.",
      "CONFLICT: This time slot has already been booked by another patient.",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to complete your booking right now. Please try again."
    );
  }
}

/**
 * Generate a Vonage Video API session using MediaMode.ROUTED.
 * Returns { ok: true, sessionId } or { ok: false, reason } cleanly without masking errors.
 */
async function createVideoSession() {
  const videoClient = getVonageVideoClient();
  if (!videoClient) {
    return {
      ok: false,
      reason: "Vonage video credentials are missing or invalid.",
    };
  }

  try {
    const session = await videoClient.createSession({
      mediaMode: MediaMode.ROUTED,
    });
    if (!session?.sessionId) {
      return {
        ok: false,
        reason: "Vonage did not return a valid session ID.",
      };
    }
    return { ok: true, sessionId: session.sessionId };
  } catch (error) {
    console.error("Failed to create Vonage video session:", error);
    return {
      ok: false,
      reason: "Unable to create Vonage video session.",
    };
  }
}

/**
 * Generate a token for a video session
 * This will be called when either doctor or patient is about to join the call
 */
export async function generateVideoToken(formData) {
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
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to join this call");
    }

    if (!["SCHEDULED", "IN_PROGRESS"].includes(appointment.status)) {
      throw new Error("This appointment is not currently scheduled");
    }

    // Calls unlock 30 minutes before the scheduled start time
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const timeDifference = (appointmentTime - now) / (1000 * 60);

    if (timeDifference > 30) {
      throw new Error(
        "The call will be available 30 minutes before the scheduled time"
      );
    }

    const videoClient = getVonageVideoClient();
    if (!videoClient) {
      throw new Error(
        "Video consultation service is unavailable. Valid Vonage credentials are required."
      );
    }

    let sessionId = appointment.videoSessionId;
    if (!sessionId) {
      const createdSession = await createVideoSession();
      if (!createdSession.ok || !createdSession.sessionId) {
        throw new Error(
          createdSession.reason || "No valid video session exists for this appointment."
        );
      }
      sessionId = createdSession.sessionId;
    }

    // Token expires 1 hour after the scheduled appointment end time
    const appointmentEndTime = new Date(appointment.endTime);
    const expirationTime =
      Math.floor(appointmentEndTime.getTime() / 1000) + 60 * 60;

    const connectionData = JSON.stringify({
      name: user.name,
      role: user.role,
      userId: user.id,
    });

    const token = videoClient.generateClientToken(sessionId, {
      role: "publisher",
      expireTime: expirationTime,
      data: connectionData,
    });

    await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        ...(appointment.videoSessionId ? {} : { videoSessionId: sessionId }),
        videoSessionToken: token,
        ...(appointment.status === "SCHEDULED" ? { status: "IN_PROGRESS" } : {}),
      },
    });

    revalidatePath("/front-desk");
    revalidatePath("/appointments");
    revalidatePath("/doctor");

    return {
      success: true,
      videoSessionId: sessionId,
      token: token,
    };
  } catch (error) {
    console.error("Failed to generate video token:", error);
    const knownSafe = [
      "Unauthorized",
      "User not found",
      "Appointment ID is required",
      "Appointment not found",
      "You are not authorized to join this call",
      "This appointment is not currently scheduled",
      "The call will be available 30 minutes before the scheduled time",
      "Video consultation service is unavailable. Valid Vonage credentials are required.",
      "No valid video session exists for this appointment.",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to join video consultation right now. Please try again."
    );
  }
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return { doctor };
  } catch (error) {
    console.error("Failed to fetch doctor:", error);
    throw new Error("Failed to fetch doctor details");
  }
}

/**
 * Get available 30-minute booking slots for the next 14 days (plus open overrides).
 */
export async function getAvailableTimeSlots(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    const now = new Date();
    const todayStr = getClinicDateString(now);

    const [weeklySchedules, overrides, legacyAvailability] = await Promise.all([
      db.weeklyAvailability
        ? db.weeklyAvailability.findMany({
            where: {
              doctorId: doctor.id,
              isActive: true,
            },
          })
        : Promise.resolve([]),
      db.availabilityOverride
        ? db.availabilityOverride.findMany({
            where: {
              doctorId: doctor.id,
              date: { gte: todayStr },
            },
            orderBy: { date: "asc" },
          })
        : Promise.resolve([]),
      db.availability.findFirst({
        where: {
          doctorId: doctor.id,
          status: "AVAILABLE",
        },
      }),
    ]);

    const hasWeekly = weeklySchedules.length > 0;
    const hasOpenOverrides = overrides.some(
      (o) => !o.isBlocked && o.startTime && o.endTime
    );
    const hasStructuredSchedule = hasWeekly || hasOpenOverrides;

    // If doctor has not configured any working hours at all, return empty list gracefully
    if (!hasStructuredSchedule && !legacyAvailability) {
      return { days: [] };
    }

    const weeklyByDay = new Map(
      weeklySchedules.map((w) => [w.dayOfWeek, w])
    );
    const overrideByDate = new Map(
      overrides.map((o) => [o.date, o])
    );

    // Build unique sorted list of YYYY-MM-DD date strings: next 14 calendar days + open overrides
    const dateStringsSet = new Set();
    for (let offset = 0; offset < 14; offset++) {
      dateStringsSet.add(addDaysToDateString(todayStr, offset));
    }
    for (const ov of overrides) {
      if (!ov.isBlocked && ov.startTime && ov.endTime && ov.date >= todayStr) {
        dateStringsSet.add(ov.date);
      }
    }

    const sortedDateStrings = Array.from(dateStringsSet).sort();

    // Fetch existing appointments covering the whole date window
    const firstDateUtc = clinicTimeToUtcDate(sortedDateStrings[0], "00:00");
    const lastDateUtc = clinicTimeToUtcDate(
      sortedDateStrings[sortedDateStrings.length - 1],
      "23:59"
    );

    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        startTime: {
          gte: firstDateUtc,
          lte: lastDateUtc,
        },
      },
    });

    const result = [];

    for (const dayString of sortedDateStrings) {
      const displayDate = formatClinicDateStr(dayString);
      const dayOfWeek = getClinicDayOfWeekFromDateStr(dayString);
      const override = overrideByDate.get(dayString);

      // Excluded if explicitly marked unavailable on this calendar date
      if (override?.isBlocked) {
        result.push({
          date: dayString,
          displayDate,
          isBlocked: true,
          blockReason: override.reason || null,
          slots: [],
        });
        continue;
      }

      let winStartTime = null;
      let winEndTime = null;

      if (override && !override.isBlocked && override.startTime && override.endTime) {
        winStartTime = override.startTime;
        winEndTime = override.endTime;
      } else {
        const weekly = weeklyByDay.get(dayOfWeek);
        if (weekly) {
          winStartTime = weekly.startTime;
          winEndTime = weekly.endTime;
        } else if (!hasStructuredSchedule && legacyAvailability) {
          winStartTime = formatInClinicTz(legacyAvailability.startTime, "HH:mm");
          winEndTime = formatInClinicTz(legacyAvailability.endTime, "HH:mm");
        }
      }

      const daySlots = [];

      if (winStartTime && winEndTime && winStartTime < winEndTime) {
        let slotStartStr = winStartTime;

        while (true) {
          const slotEndStr = addMinutesToHHMM(slotStartStr, 30);
          if (slotEndStr > winEndTime) {
            break;
          }

          const currentUtc = clinicTimeToUtcDate(dayString, slotStartStr);
          const nextUtc = clinicTimeToUtcDate(dayString, slotEndStr);

          // Skip past or already-started slots for today
          if (currentUtc.getTime() > now.getTime()) {
            const overlaps = existingAppointments.some((appointment) => {
              const aStart = new Date(appointment.startTime);
              const aEnd = new Date(appointment.endTime);

              return (
                (currentUtc >= aStart && currentUtc < aEnd) ||
                (nextUtc > aStart && nextUtc <= aEnd) ||
                (currentUtc <= aStart && nextUtc >= aEnd)
              );
            });

            const formattedStartTime = formatTime12h(slotStartStr);
            const formattedEndTime = formatTime12h(slotEndStr);
            const formatted = `${formattedStartTime} - ${formattedEndTime}`;

            daySlots.push({
              startTime: currentUtc.toISOString(),
              endTime: nextUtc.toISOString(),
              formatted,
              formattedStartTime,
              formattedEndTime,
              day: displayDate,
              isBooked: overlaps,
            });
          }

          slotStartStr = slotEndStr;
        }
      }

      result.push({
        date: dayString,
        displayDate,
        isBlocked: false,
        slots: daySlots,
      });
    }

    return { days: result };
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return { days: [] };
  }
}

/**
 * Reschedule an existing SCHEDULED appointment to a new available doctor slot.
 * Enforces RBAC, working-hours/override validation, transaction concurrency safety, and AuditLog.
 */
export async function rescheduleAppointment(formData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Sign in required");
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!currentUser) {
      throw new Error("User not found in system");
    }

    const appointmentId = formData.get("appointmentId");
    const newStartTime = new Date(formData.get("startTime"));
    const newEndTime = new Date(formData.get("endTime"));

    if (!appointmentId || isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
      throw new Error("Appointment ID, new start time, and end time are required.");
    }

    if (newEndTime <= newStartTime) {
      throw new Error("Invalid appointment time range.");
    }

    if (newStartTime.getTime() <= Date.now()) {
      throw new Error(
        "Cannot reschedule to a past time slot. Please select an upcoming time slot."
      );
    }

    const targetDateStr = formatInClinicTz(newStartTime, "yyyy-MM-dd");

    // 1. Read-only validation & doctor schedule lookup OUTSIDE the transaction
    // so parallel queries run fast across the pool and do not hold a transaction lock.
    const appointment = await db.appointment.findUnique({
      where: { id: String(appointmentId) },
      include: {
        doctor: {
          select: { id: true, name: true, role: true, verificationStatus: true },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    const isStaffManager =
      (currentUser.role === "FRONT_DESK" &&
        currentUser.verificationStatus === "VERIFIED") ||
      currentUser.role === "ADMIN";
    const isAuthorized =
      appointment.patientId === currentUser.id ||
      appointment.doctorId === currentUser.id ||
      isStaffManager;

    if (!isAuthorized) {
      throw new Error("FORBIDDEN: You are not authorized to reschedule this appointment.");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be rescheduled.");
    }

    if (
      new Date(appointment.startTime).getTime() === newStartTime.getTime() &&
      new Date(appointment.endTime).getTime() === newEndTime.getTime()
    ) {
      throw new Error("Please select a different time slot to reschedule.");
    }

    if (appointment.doctor?.verificationStatus !== "VERIFIED") {
      throw new Error("Doctor is not available for rescheduling.");
    }

    const [override, weeklyForDay, hasAnyWeekly, hasLegacySlots] = await Promise.all([
      db.availabilityOverride
        ? db.availabilityOverride.findUnique({
            where: {
              doctorId_date: {
                doctorId: appointment.doctorId,
                date: targetDateStr,
              },
            },
          })
        : null,
      db.weeklyAvailability
        ? db.weeklyAvailability.findUnique({
            where: {
              doctorId_dayOfWeek: {
                doctorId: appointment.doctorId,
                dayOfWeek: getClinicDayOfWeek(newStartTime),
              },
            },
          })
        : null,
      db.weeklyAvailability
        ? db.weeklyAvailability.count({
            where: { doctorId: appointment.doctorId, isActive: true },
          })
        : 0,
      db.availability.count({
        where: { doctorId: appointment.doctorId },
      }),
    ]);

    if (override?.isBlocked) {
      throw new Error("Doctor is unavailable on the selected date.");
    }

    const slotStartHHMM = formatInClinicTz(newStartTime, "HH:mm");
    const slotEndHHMM = formatInClinicTz(newEndTime, "HH:mm");
    const sameDaySlot =
      formatInClinicTz(newStartTime, "yyyy-MM-dd") ===
      formatInClinicTz(newEndTime, "yyyy-MM-dd");

    if (override && !override.isBlocked && override.startTime && override.endTime) {
      if (!sameDaySlot || slotStartHHMM < override.startTime || slotEndHHMM > override.endTime) {
        throw new Error("Selected time is outside the doctor's available hours for this date.");
      }
    } else if (hasAnyWeekly > 0) {
      if (
        !weeklyForDay?.isActive ||
        !sameDaySlot ||
        slotStartHHMM < weeklyForDay.startTime ||
        slotEndHHMM > weeklyForDay.endTime
      ) {
        throw new Error("Selected time is outside the doctor's weekly working hours.");
      }
    }

    // 2. Minimal atomic transaction: re-verify status, check overlap, and update
    const result = await db.$transaction(
      async (tx) => {
        const freshAppointment = await tx.appointment.findUnique({
          where: { id: appointment.id },
          select: { id: true, status: true, startTime: true, endTime: true },
        });

        if (!freshAppointment) {
          throw new Error("Appointment not found.");
        }
        if (freshAppointment.status !== "SCHEDULED") {
          throw new Error("Only scheduled appointments can be rescheduled.");
        }

        const overlapping = await findOverlappingAppointment(tx, {
          doctorId: appointment.doctorId,
          startTime: newStartTime,
          endTime: newEndTime,
          excludeAppointmentId: appointment.id,
        });

        if (overlapping) {
          throw new Error("CONFLICT: This time slot has already been booked by another patient.");
        }

        if (hasLegacySlots > 0) {
          await tx.availability.updateMany({
            where: {
              doctorId: appointment.doctorId,
              startTime: freshAppointment.startTime,
              endTime: freshAppointment.endTime,
              status: "BOOKED",
            },
            data: { status: "AVAILABLE" },
          });

          await tx.availability.updateMany({
            where: {
              doctorId: appointment.doctorId,
              startTime: { lte: newStartTime },
              endTime: { gte: newEndTime },
            },
            data: { status: "BOOKED" },
          });
        }

        const updatedAppointment = await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            startTime: newStartTime,
            endTime: newEndTime,
          },
        });

        return {
          previousStartTime: freshAppointment.startTime,
          previousEndTime: freshAppointment.endTime,
          appointment: updatedAppointment,
        };
      },
      { maxWait: 10000, timeout: 20000 }
    );

    await createAuditLog({
      action: "RESCHEDULE_APPOINTMENT",
      resourceType: "Appointment",
      resourceId: result.appointment.id,
      details: {
        rescheduledByRole: currentUser.role,
        doctorId: result.appointment.doctorId,
        patientId: result.appointment.patientId,
        previousStartTime: result.previousStartTime,
        previousEndTime: result.previousEndTime,
        newStartTime: result.appointment.startTime,
        newEndTime: result.appointment.endTime,
      },
      userId: currentUser.id,
    });

    revalidatePath("/appointments");
    revalidatePath("/front-desk");
    revalidatePath("/doctor");
    revalidatePath("/doctors", "layout");

    return { success: true, appointment: result.appointment };
  } catch (error) {
    console.error("Failed to reschedule appointment:", error);
    if (error?.code === "P2002") {
      throw new Error("CONFLICT: This time slot has already been booked by another patient.");
    }
    const knownSafe = [
      "Unauthorized: Sign in required",
      "User not found in system",
      "Appointment ID, new start time, and end time are required.",
      "Invalid appointment time range.",
      "Cannot reschedule to a past time slot. Please select an upcoming time slot.",
      "Appointment not found.",
      "FORBIDDEN: You are not authorized to reschedule this appointment.",
      "Only scheduled appointments can be rescheduled.",
      "Please select a different time slot to reschedule.",
      "Doctor is not available for rescheduling.",
      "Doctor is unavailable on the selected date.",
      "Selected time is outside the doctor's available hours for this date.",
      "Selected time is outside the doctor's weekly working hours.",
      "CONFLICT: This time slot has already been booked by another patient.",
    ];
    throw new Error(
      knownSafe.includes(error.message)
        ? error.message
        : "Unable to reschedule this appointment right now. Please try again."
    );
  }
}
