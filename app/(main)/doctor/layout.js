import Link from "next/link";
import { requireRole, ROLES } from "@/lib/rbac";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Doctor Dashboard - MediMeet",
  description: "Manage your appointments, availability, and patient consultations",
};

export default async function DoctorDashboardLayout({ children }) {
  // Server-side RBAC guard: Only DOCTOR and ADMIN can access Doctor views
  await requireRole([ROLES.DOCTOR, ROLES.ADMIN]);

  return (
    <div className="w-full bg-white text-slate-900 px-3 sm:px-6 pt-3 pb-6">
      <div className="relative mb-6">
        <Link
          href="/"
          className="text-sm text-slate-700 hover:text-black font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer md:absolute md:left-0 md:top-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="text-center mt-2 md:mt-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Doctor Dashboard
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
        </div>
      </div>
      {children}
    </div>
  );
}
