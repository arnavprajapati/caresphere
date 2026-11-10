import { db } from "@/lib/prisma";
import { DoctorProfile } from "./_components/doctor-profile";
import { redirect } from "next/navigation";
import { getAvailableTimeSlots } from "@/actions/appointments";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  let doctor = null;
  let slotsData = null;
  let allDoctors = [];

  try {
    // Fetch doctor — allow any verificationStatus so page doesn't 500 for unverified
    doctor = await db.user.findUnique({
      where: { id, role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        qualification: true,
        experience: true,
        imageUrl: true,
        description: true,
        consultationFee: true,
        verificationStatus: true,
      },
    });
  } catch (error) {
    console.error("Error loading doctor:", error);
  }

  if (!doctor) {
    redirect("/doctors");
  }

  // Only verified doctors can be booked
  if (doctor.verificationStatus !== "VERIFIED") {
    redirect("/doctors");
  }

  try {
    const [slots, doctors] = await Promise.all([
      getAvailableTimeSlots(id),
      db.user.findMany({
        where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
        select: {
          id: true,
          name: true,
          specialty: true,
          qualification: true,
          experience: true,
          imageUrl: true,
          description: true,
          consultationFee: true,
        },
      }),
    ]);
    slotsData = slots;
    allDoctors = doctors || [];
  } catch (error) {
    console.error("Error loading slots/doctors:", error);
    slotsData = { days: [] };
    allDoctors = [];
  }

  return (
    <DoctorProfile
      doctor={doctor}
      availableDays={slotsData?.days || []}
      allDoctors={allDoctors}
    />
  );
}
