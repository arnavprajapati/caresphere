import { db } from "@/lib/prisma";
import { requireRole, ROLES } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Receipt, Stethoscope } from "lucide-react";
import { SPECIALTIES } from "@/lib/specialities";
import { FrontDeskWorkspace } from "./_components/front-desk-workspace";

export const dynamic = "force-dynamic";

export default async function FrontDeskPage() {
  await requireRole([ROLES.FRONT_DESK, ROLES.ADMIN]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch operational overview metrics + Front-Desk booking fixtures
  const [patientsCount, todayAppointments, unpaidInvoices, doctors, initialPatients] =
    await Promise.all([
      db.user.count({ where: { role: "PATIENT" } }),
      db.appointment.findMany({
        where: {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
          invoice: { select: { id: true, status: true, totalAmount: true } },
        },
        orderBy: { startTime: "asc" },
        take: 50,
      }),
      db.invoice.count({ where: { status: "UNPAID" } }),
      db.user.findMany({
        where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
        select: {
          id: true,
          name: true,
          specialty: true,
          qualification: true,
          consultationFee: true,
        },
        orderBy: { name: "asc" },
      }),
      db.user.findMany({
        where: { role: "PATIENT" },
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
      }),
    ]);

  const metrics = [
    {
      label: "Total Patients",
      value: patientsCount,
      sublabel: "Registered accounts",
      icon: Users,
    },
    {
      label: "Today's Visits",
      value: todayAppointments.length,
      sublabel: "Scheduled today",
      icon: Calendar,
    },
    {
      label: "Active Doctors",
      value: doctors.length,
      sublabel: "Verified clinicians",
      icon: Stethoscope,
    },
    {
      label: "Unpaid Invoices",
      value: unpaidInvoices,
      sublabel: "Pending settlement",
      icon: Receipt,
    },
  ];

  const specialtyNames = SPECIALTIES.map((s) => s.name);

  return (
    <div className="space-y-6">
      {/* Uniform Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="h-full min-h-[148px] bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0"
            >
              <CardContent className="p-6 h-full flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 leading-snug">
                    {metric.label}
                  </p>
                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 text-black flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                    {metric.value}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {metric.sublabel}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FrontDeskWorkspace
        initialPatients={initialPatients}
        doctors={doctors}
        specialties={specialtyNames}
        todayAppointments={todayAppointments}
      />
    </div>
  );
}
