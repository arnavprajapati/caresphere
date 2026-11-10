import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get appointments scoped to the authenticated user's role:
 * - PATIENT: their own appointments
 * - DOCTOR: appointments assigned to them
 * - FRONT_DESK / ADMIN: all hospital appointments
 */
export async function getPatientAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isStaffViewer =
      user.role === "FRONT_DESK" || user.role === "ADMIN";
    const whereClause =
      user.role === "PATIENT"
        ? { patientId: user.id }
        : user.role === "DOCTOR"
        ? { doctorId: user.id }
        : isStaffViewer
        ? {}
        : { patientId: user.id };

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        invoice: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        ...(user.role !== "FRONT_DESK"
          ? {
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
            }
          : {}),
      },
      orderBy: {
        startTime: isStaffViewer ? "desc" : "asc",
      },
      ...(isStaffViewer ? { take: 100 } : {}),
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to get appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
