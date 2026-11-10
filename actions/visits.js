"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, ROLES } from "@/lib/rbac";

const ALLOWED_REPORT_STATUSES = new Set(["ORDERED", "PENDING", "COMPLETED"]);

/**
 * Creates or updates clinical visit records, prescriptions, and diagnostic report metadata.
 * Strictly clinician-authorized (Acceptance Test #3 & #5).
 */
export async function saveVisitRecord(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: Sign in required");

  const doctorUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!doctorUser || (doctorUser.role !== ROLES.DOCTOR && doctorUser.role !== ROLES.ADMIN)) {
    throw new Error("FORBIDDEN: Only clinicians can record clinical visit notes and prescriptions");
  }

  const appointmentId = formData.get("appointmentId");
  const symptoms = formData.get("symptoms") ?? "";
  const diagnosis = formData.get("diagnosis") ?? "";
  const clinicianNotes = formData.get("clinicianNotes") ?? "";
  const followUpDateStr = formData.get("followUpDate");
  const medicinesJson = formData.get("medicines"); // JSON array: [{ medicineName, dosage, frequency, duration, instructions }]
  const hasMedicinesPayload = formData.has("medicines");
  const diagnosticReportsJson = formData.get("diagnosticReports"); // JSON array: [{ reportTitle, reportType, status, reportDate, referenceCode, summary }]
  const hasDiagnosticReportsPayload = formData.has("diagnosticReports");
  const markCompleted = formData.get("markCompleted") === "true";

  if (!appointmentId) throw new Error("Appointment ID is required");

  const appointment = await db.appointment.findUnique({
    where: { id: String(appointmentId) },
  });

  if (!appointment) throw new Error("Appointment not found");

  // Ensure this doctor is assigned to this appointment (or user is ADMIN)
  if (doctorUser.role !== ROLES.ADMIN && appointment.doctorId !== doctorUser.id) {
    throw new Error("FORBIDDEN: You can only record visit notes for your own patient appointments");
  }

  let medicines = [];
  if (medicinesJson) {
    try {
      const parsed = JSON.parse(medicinesJson);
      if (Array.isArray(parsed)) medicines = parsed;
    } catch {
      medicines = [];
    }
  }

  let diagnosticReports = [];
  if (diagnosticReportsJson) {
    try {
      const parsed = JSON.parse(diagnosticReportsJson);
      if (Array.isArray(parsed)) diagnosticReports = parsed;
    } catch {
      diagnosticReports = [];
    }
  }

  const followUpDate = followUpDateStr ? new Date(followUpDateStr) : null;

  const result = await db.$transaction(async (tx) => {
    // 1. Upsert VisitRecord
    const visitRecord = await tx.visitRecord.upsert({
      where: { appointmentId: String(appointmentId) },
      update: {
        symptoms,
        diagnosis,
        clinicianNotes,
        followUpDate: followUpDate && !isNaN(followUpDate.getTime()) ? followUpDate : null,
        updatedAt: new Date(),
      },
      create: {
        appointmentId: String(appointmentId),
        doctorId: appointment.doctorId,
        symptoms,
        diagnosis,
        clinicianNotes,
        followUpDate: followUpDate && !isNaN(followUpDate.getTime()) ? followUpDate : null,
      },
    });

    // 2. Replace Prescriptions when medicines payload is provided
    if (hasMedicinesPayload) {
      await tx.prescription.deleteMany({
        where: { visitRecordId: visitRecord.id },
      });

      for (const med of medicines) {
        if (med?.medicineName?.trim()) {
          await tx.prescription.create({
            data: {
              visitRecordId: visitRecord.id,
              doctorId: appointment.doctorId,
              medicineName: med.medicineName.trim(),
              dosage: med.dosage?.trim() || "1 tablet",
              frequency: med.frequency?.trim() || "Once daily",
              duration: med.duration?.trim() || "5 days",
              instructions: med.instructions?.trim() || "",
            },
          });
        }
      }
    }

    // 3. Replace DiagnosticReport metadata when diagnosticReports payload is provided
    if (hasDiagnosticReportsPayload && tx.diagnosticReport) {
      await tx.diagnosticReport.deleteMany({
        where: { visitRecordId: visitRecord.id },
      });

      for (const report of diagnosticReports) {
        if (report?.reportTitle?.trim()) {
          const parsedReportDate = report.reportDate ? new Date(report.reportDate) : null;
          const normalizedStatus = ALLOWED_REPORT_STATUSES.has(report.status)
            ? report.status
            : "ORDERED";

          await tx.diagnosticReport.create({
            data: {
              visitRecordId: visitRecord.id,
              doctorId: appointment.doctorId,
              reportTitle: report.reportTitle.trim(),
              reportType: report.reportType?.trim() || "Lab Test",
              status: normalizedStatus,
              reportDate:
                parsedReportDate && !isNaN(parsedReportDate.getTime())
                  ? parsedReportDate
                  : null,
              referenceCode: report.referenceCode?.trim() || null,
              summary: report.summary?.trim() || null,
            },
          });
        }
      }
    }

    // 4. Optionally mark appointment COMPLETED only when explicitly requested
    if (markCompleted) {
      await tx.appointment.update({
        where: { id: String(appointmentId) },
        data: { status: "COMPLETED" },
      });
    }

    return await tx.visitRecord.findUnique({
      where: { id: visitRecord.id },
      include: {
        prescriptions: true,
        ...(tx.diagnosticReport
          ? { diagnosticReports: { orderBy: { createdAt: "asc" } } }
          : {}),
      },
    });
  });

  // 5. Audit Log (Acceptance Test #5)
  await createAuditLog({
    action: "SAVE_CLINICAL_VISIT_RECORD",
    resourceType: "VisitRecord",
    resourceId: result.id,
    details: {
      appointmentId,
      diagnosisSummary: diagnosis,
      prescriptionsCount: result.prescriptions?.length || 0,
      diagnosticReportsCount: result.diagnosticReports?.length || 0,
    },
    userId: doctorUser.id,
  });

  revalidatePath("/doctor");
  revalidatePath("/appointments");
  return { success: true, visitRecord: result };
}

/**
 * Reads a visit record with role-based field separation (Acceptance Test #3 & #5).
 * - Clinicians & Patients can view.
 * - Front-desk is blocked from viewing confidential clinical notes.
 */
export async function getVisitRecord(appointmentId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const visitRecord = await db.visitRecord.findUnique({
    where: { appointmentId },
    include: {
      prescriptions: true,
      ...(db.diagnosticReport
        ? { diagnosticReports: { orderBy: { createdAt: "asc" } } }
        : {}),
      appointment: {
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
          patient: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!visitRecord) return null;

  // Authorization check: Only assigned Doctor, Patient themselves, or Admin can read
  const isDoctor = user.role === ROLES.DOCTOR && visitRecord.doctorId === user.id;
  const isPatient = user.role === ROLES.PATIENT && visitRecord.appointment.patientId === user.id;
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isDoctor && !isPatient && !isAdmin) {
    throw new Error("FORBIDDEN: Front-desk and unauthorized roles cannot view confidential clinician notes.");
  }

  // Audit Log read access on sensitive health data (Acceptance Test #5)
  await createAuditLog({
    action: "VIEW_CLINICAL_RECORD",
    resourceType: "VisitRecord",
    resourceId: visitRecord.id,
    details: { viewerRole: user.role, appointmentId },
    userId: user.id,
  });

  return visitRecord;
}
