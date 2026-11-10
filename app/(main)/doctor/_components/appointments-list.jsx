"use client";

import { useEffect } from "react";
import { getDoctorAppointments } from "@/actions/doctor";
import { AppointmentCard } from "@/components/appointment-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import useFetch from "@/hooks/use-fetch";

export default function DoctorAppointmentsList() {
  const {
    loading,
    data,
    fn: fetchAppointments,
  } = useFetch(getDoctorAppointments);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const appointments = data?.appointments || [];

  return (
    <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
      <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
          <Calendar className="h-5 w-5 text-black shrink-0" />
          Scheduled Consultations
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs sm:text-sm">
          Review upcoming patient visits and manage active consultation records
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm font-medium">
              Loading consultations...
            </p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                userRole="DOCTOR"
                refetchAppointments={fetchAppointments}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <div className="w-12 h-12 rounded-md bg-white border border-slate-200 text-black flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-black mb-1">
              No upcoming appointments
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You do not have any scheduled patient consultations. Set your working hours and available slots under the Working Availability tab.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
