import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDoctorAppointments, getDoctorAvailability } from "@/actions/doctor";
import { AvailabilitySettings } from "./_components/availability-settings";
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { Calendar, Clock, DollarSign, User } from "lucide-react";
import DoctorAppointmentsList from "./_components/appointments-list";
import { getDoctorEarnings, getDoctorPayouts } from "@/actions/payout";
import { DoctorEarnings } from "./_components/doctor-earnings";
import { DoctorProfileOverview } from "@/components/doctor-profile-overview";

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();

  const [appointmentsData, availabilityData, earningsData, payoutsData] =
    await Promise.all([
      getDoctorAppointments(),
      getDoctorAvailability(),
      getDoctorEarnings(),
      getDoctorPayouts(),
    ]);

  if (user?.role !== "DOCTOR") {
    redirect("/onboarding");
  }

  if (user?.verificationStatus !== "VERIFIED") {
    redirect("/doctor/verification");
  }

  return (
    <Tabs
      defaultValue="profile"
      className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start"
    >
      <TabsList className="lg:sticky lg:top-20 !bg-white border border-slate-200 shadow-none h-auto flex flex-col w-full p-2 rounded-lg space-y-1">
        <TabsTrigger
          value="profile"
          className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
        >
          <User className="h-4 w-4 mr-2.5 shrink-0" />
          <span>Professional Profile</span>
        </TabsTrigger>
        <TabsTrigger
          value="earnings"
          className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
        >
          <DollarSign className="h-4 w-4 mr-2.5 shrink-0" />
          <span>Earnings & Metrics</span>
        </TabsTrigger>
        <TabsTrigger
          value="appointments"
          className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
        >
          <Calendar className="h-4 w-4 mr-2.5 shrink-0" />
          <span>Patient Appointments</span>
        </TabsTrigger>
        <TabsTrigger
          value="availability"
          className="cursor-pointer flex items-center justify-start px-3.5 py-2.5 w-full rounded-md text-sm font-medium !bg-white !text-slate-800 hover:!bg-slate-100 hover:!text-black data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:font-semibold transition-colors shadow-none"
        >
          <Clock className="h-4 w-4 mr-2.5 shrink-0" />
          <span>Working Availability</span>
        </TabsTrigger>
      </TabsList>
      <div className="min-w-0">
        <TabsContent value="profile" className="border-none p-0 mt-0">
          <DoctorProfileOverview
            doctor={user}
            patientsCount={appointmentsData?.appointments?.length || 0}
            weeklySchedule={availabilityData?.weeklySchedule || []}
            legacySlots={availabilityData?.slots || []}
          />
        </TabsContent>
        <TabsContent value="appointments" className="border-none p-0 mt-0">
          <DoctorAppointmentsList
            appointments={appointmentsData.appointments || []}
          />
        </TabsContent>
        <TabsContent value="availability" className="border-none p-0 mt-0">
          <AvailabilitySettings
            slots={availabilityData?.slots || []}
            initialWeeklySchedule={availabilityData?.weeklySchedule || []}
            initialOverrides={availabilityData?.overrides || []}
            availabilityError={availabilityData?.error || null}
            initialFee={user?.consultationFee || 500}
          />
        </TabsContent>
        <TabsContent value="earnings" className="border-none p-0 mt-0">
          <DoctorEarnings
            earnings={earningsData.earnings || {}}
            payouts={payoutsData.payouts || []}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
