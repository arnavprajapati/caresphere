import Link from "next/link";
import { db } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const doctor = await db.user.findUnique({
      where: { id, role: "DOCTOR" },
      select: { name: true, specialty: true, experience: true },
    });
    if (!doctor) return { title: "Doctor Profile - Medilink" };
    return {
      title: `Dr. ${doctor.name || "Doctor"} - Medilink`,
      description: `Book an appointment with Dr. ${doctor.name || "Doctor"}, ${doctor.specialty || "Specialist"} with ${doctor.experience || 0} years of experience.`,
    };
  } catch {
    return { title: "Doctor Profile - Medilink" };
  }
}

export default async function DoctorProfileLayout({ children }) {
  return (
    <div className="w-full">
      <div className="mb-2">
        <Link
          href="/doctors"
          className="text-sm text-black dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
        >
          &larr; Back to Doctors Directory
        </Link>
      </div>
      {children}
    </div>
  );
}
