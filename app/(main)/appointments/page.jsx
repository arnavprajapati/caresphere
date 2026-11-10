import { getPatientAppointments } from "@/actions/patient";
import { AppointmentCard } from "@/components/appointment-card";
import { Calendar, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role === "UNASSIGNED") {
    redirect("/onboarding");
  }

  const isStaffViewer =
    user.role === "FRONT_DESK" || user.role === "ADMIN";
  const { appointments, error } = await getPatientAppointments();

  const backHref =
    user.role === "FRONT_DESK"
      ? "/front-desk"
      : user.role === "ADMIN"
      ? "/admin"
      : user.role === "DOCTOR"
      ? "/doctor"
      : "/";
  const backLabel =
    user.role === "FRONT_DESK"
      ? "Back to Front Desk"
      : user.role === "ADMIN"
      ? "Back to Admin"
      : user.role === "DOCTOR"
      ? "Back to Doctor Dashboard"
      : "Back to Home";

  return (
    <div className="w-full bg-white text-black px-3 sm:px-6 pt-3 pb-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative pb-5 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 md:mb-3 mb-2">
            <Link
              href={backHref}
              className="text-sm text-slate-700 hover:text-black font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer md:absolute md:left-0 md:top-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
            <Link
              href="/doctors"
              className="cursor-pointer shrink-0 ml-auto md:absolute md:right-0 md:top-1"
            >
              <Button className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-10 px-5 text-sm shadow-none flex items-center gap-2 cursor-pointer">
                <Search className="h-4 w-4" />
                {isStaffViewer ? "Book Appointment" : "Find New Doctor"}
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
              {isStaffViewer ? "Hospital Appointments" : "Consultations & Visits"}
            </h1>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
            <p className="text-sm text-slate-600 mt-2.5">
              {isStaffViewer
                ? "Hospital-wide consultation schedule, patient bookings, and visit status"
                : "Track your scheduled appointments, clinical diagnosis, and digital prescriptions"}
            </p>
          </div>
        </div>

        <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
          <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-black">
                  {isStaffViewer ? "Appointments Directory" : "Scheduled Visits"}
                </CardTitle>
                <CardDescription className="text-slate-600 text-xs sm:text-sm mt-1">
                  {isStaffViewer
                    ? "Upcoming and past consultations across all clinicians and patients"
                    : "Upcoming and past consultations with healthcare specialists"}
                </CardDescription>
              </div>
              {!error && (
                <Badge
                  variant="outline"
                  className="bg-black text-white border-black font-bold px-3.5 py-1.5 rounded-md text-xs w-fit shrink-0"
                >
                  {appointments?.length || 0} Total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error ? (
              <div className="text-center py-8">
                <p className="text-rose-600 text-sm font-medium">Error: {error}</p>
              </div>
            ) : appointments?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    userRole={user.role}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
                <div className="w-12 h-12 rounded-md bg-white border border-slate-200 text-black flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-black mb-1">
                  No consultations scheduled yet
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mb-5">
                  {isStaffViewer
                    ? "No patient appointments have been booked yet. Browse verified specialists to schedule a consultation."
                    : "You have not booked any appointments yet. Browse verified specialists and schedule your consultation."}
                </p>
                <Link href="/doctors" className="inline-block cursor-pointer">
                  <Button className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md px-6 h-10 cursor-pointer shadow-none">
                    Browse Verified Doctors
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
