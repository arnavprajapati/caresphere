"use server";

import crypto from "crypto";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog, requireRole, ROLES } from "@/lib/rbac";

/**
 * Search existing patient records for Front-Desk / Admin booking.
 */
export async function searchPatients(query = "") {
  await requireRole([ROLES.FRONT_DESK, ROLES.ADMIN], {
    redirectOnError: false,
  });

  const trimmed = String(query || "").trim();

  try {
    const patients = await db.user.findMany({
      where: {
        role: ROLES.PATIENT,
        ...(trimmed
          ? {
              OR: [
                { name: { contains: trimmed, mode: "insensitive" } },
                { email: { contains: trimmed, mode: "insensitive" } },
                { phone: { contains: trimmed, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return { success: true, patients };
  } catch (error) {
    console.error("Failed to search patients:", error);
    return { success: false, patients: [], error: "Unable to search patients right now." };
  }
}

/**
 * Register a new walk-in / front-desk patient without requiring Clerk self-signup.
 */
export async function registerWalkInPatient(formData) {
  const staffUser = await requireRole([ROLES.FRONT_DESK, ROLES.ADMIN], {
    redirectOnError: false,
  });

  const name = String(formData.get("name") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const rawGender = String(formData.get("gender") || "").trim().toUpperCase();
  const address = String(formData.get("address") || "").trim();

  if (!name) {
    throw new Error("Patient full name is required.");
  }

  if (!rawEmail && !phone) {
    throw new Error("Please provide either an email address or a phone number.");
  }

  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const normalizedPhoneDigits = phone.replace(/\D/g, "");
  const effectiveEmail =
    rawEmail ||
    `walkin.${normalizedPhoneDigits || Date.now()}@patient.medicare.local`;

  const existingByEmail = await db.user.findUnique({
    where: { email: effectiveEmail },
    select: { id: true, role: true },
  });

  if (existingByEmail) {
    if (existingByEmail.role === ROLES.PATIENT) {
      throw new Error(
        "A patient with this email already exists. Please select them from the patient list."
      );
    }
    throw new Error("An account with this email already belongs to hospital staff.");
  }

  const allowedGenders = ["MALE", "FEMALE", "OTHER"];
  const gender = allowedGenders.includes(rawGender) ? rawGender : null;

  const patient = await db.user.create({
    data: {
      clerkUserId: `walkin_${crypto.randomUUID()}`,
      name,
      email: effectiveEmail,
      phone: phone || null,
      gender,
      address: address || null,
      role: ROLES.PATIENT,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      gender: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    action: "REGISTER_WALKIN_PATIENT",
    resourceType: "User",
    resourceId: patient.id,
    details: { name: patient.name, email: patient.email, phone: patient.phone },
    userId: staffUser.id,
  });

  revalidatePath("/front-desk");
  return { success: true, patient };
}

/**
 * Mark a scheduled appointment as checked-in (IN_PROGRESS) when the patient arrives.
 */
export async function checkInAppointment(appointmentId) {
  const staffUser = await requireRole([ROLES.FRONT_DESK, ROLES.ADMIN], {
    redirectOnError: false,
  });

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  const appointment = await db.appointment.findUnique({
    where: { id: String(appointmentId) },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  if (appointment.status === "IN_PROGRESS") {
    return { success: true, appointment };
  }

  if (appointment.status !== "SCHEDULED") {
    throw new Error("Only scheduled appointments can be checked in.");
  }

  const updated = await db.appointment.update({
    where: { id: appointment.id },
    data: { status: "IN_PROGRESS" },
  });

  await createAuditLog({
    action: "CHECK_IN_PATIENT",
    resourceType: "Appointment",
    resourceId: appointment.id,
    details: {
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      previousStatus: appointment.status,
      newStatus: "IN_PROGRESS",
    },
    userId: staffUser.id,
  });

  revalidatePath("/front-desk");
  revalidatePath("/appointments");
  revalidatePath("/doctor");

  return { success: true, appointment: updated };
}
