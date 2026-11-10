import Link from "next/link";
import { requireRole, ROLES } from "@/lib/rbac";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Front Desk Dashboard - Hospital Management System",
  description: "Patient registration, appointment scheduling, and billing management",
};

export default async function FrontDeskLayout({ children }) {
  // Server-side RBAC guard: Only FRONT_DESK and ADMIN can access this view
  await requireRole([ROLES.FRONT_DESK, ROLES.ADMIN]);

  return (
    <div className="w-full bg-white text-black px-3 sm:px-6 pt-3 pb-6">
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
            Front-Desk Operations
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-sm text-slate-600 mt-2.5">
            Patient registration, appointment scheduling, and billing management
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
