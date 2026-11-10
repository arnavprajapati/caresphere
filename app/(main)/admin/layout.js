import Link from "next/link";
import { requireRole, ROLES } from "@/lib/rbac";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, FileText, ArrowLeft, ClipboardList } from "lucide-react";

export const metadata = {
  title: "Admin Panel - Hospital Management System",
  description: "Manage staff, doctors, verification, and audit logs",
};

export default async function AdminLayout({ children }) {
  await requireRole([ROLES.ADMIN]);

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
            Administrator Console
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-sm text-slate-600 mt-2.5">
            Hospital compliance, credential verification, and system-wide audit monitoring
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="pending"
        className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start"
      >
        <TabsList className="lg:sticky lg:top-20 !bg-white border border-slate-200 shadow-none h-auto flex flex-col w-full p-2 rounded-lg space-y-1">
          <TabsTrigger
            value="pending"
            className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
          >
            <AlertCircle className="h-4 w-4 mr-2.5 shrink-0" />
            <span>Doctor Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value="front-desk"
            className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
          >
            <ClipboardList className="h-4 w-4 mr-2.5 shrink-0" />
            <span>Front-Desk Staff</span>
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
          >
            <Users className="h-4 w-4 mr-2.5 shrink-0" />
            <span>Doctors Directory</span>
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
          >
            <FileText className="h-4 w-4 mr-2.5 shrink-0" />
            <span>System Audit Trail</span>
          </TabsTrigger>
        </TabsList>
        <div className="min-w-0">{children}</div>
      </Tabs>
    </div>
  );
}
