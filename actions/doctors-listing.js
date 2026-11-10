"use server";

import { db } from "@/lib/prisma";

/**
 * Get doctors with multi-faceted filtering (Specialty, Experience, Fees)
 */
export async function getFilteredDoctors({ specialty, experience, feeRange } = {}) {
  try {
    const whereClause = {
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    };

    if (specialty) {
      const rawSpecs = Array.isArray(specialty) ? specialty : [specialty];
      const decodedSpecs = rawSpecs
        .filter(Boolean)
        .map((s) => {
          try {
            return decodeURIComponent(s).trim();
          } catch {
            return s.split("%20").join(" ").trim();
          }
        })
        .filter(Boolean);

      if (decodedSpecs.length === 1) {
        whereClause.specialty = {
          equals: decodedSpecs[0],
          mode: "insensitive",
        };
      } else if (decodedSpecs.length > 1) {
        whereClause.OR = decodedSpecs.map((spec) => ({
          specialty: {
            equals: spec,
            mode: "insensitive",
          },
        }));
      }
    }

    if (experience) {
      if (experience === "0-5") {
        whereClause.experience = { lte: 5 };
      } else if (experience === "6-10") {
        whereClause.experience = { gte: 6, lte: 10 };
      } else if (experience === "11+") {
        whereClause.experience = { gte: 11 };
      }
    }

    if (feeRange) {
      if (feeRange === "100-500") {
        whereClause.consultationFee = { lte: 500 };
      } else if (feeRange === "500-1000") {
        whereClause.consultationFee = { gte: 500, lte: 1000 };
      } else if (feeRange === "1000+") {
        whereClause.consultationFee = { gte: 1000 };
      }
    }

    const doctors = await db.user.findMany({
      where: whereClause,
      include: {
        department: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { doctors };
  } catch (error) {
    console.error("Failed to fetch filtered doctors:", error);
    return { doctors: [] };
  }
}

/**
 * Get doctors by specialty (backward compatible)
 */
export async function getDoctorsBySpecialty(specialty) {
  return await getFilteredDoctors({ specialty });
}
