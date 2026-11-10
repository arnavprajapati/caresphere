"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Receipt, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { bookAppointment } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function AppointmentForm({
  doctorId,
  slot,
  doctorFee = 249,
  onBack,
  onComplete,
}) {
  const [description, setDescription] = useState("");

  const {
    loading,
    data,
    fn: submitBooking,
  } = useFetch(bookAppointment);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("doctorId", doctorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("patientDescription", description);

    await submitBooking(formData);
  };

  useEffect(() => {
    if (data) {
      if (data.success) {
        toast.success("Appointment booked successfully! Invoice generated.");
        onComplete();
      }
    }
  }, [data]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center text-sm font-semibold text-slate-900">
          <Calendar className="h-4 w-4 text-blue-600 mr-2.5" />
          <span>{format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center text-sm text-slate-700">
          <Clock className="h-4 w-4 text-blue-600 mr-2.5" />
          <span>{slot.formatted}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/80 pt-2.5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span>Consultation Fee:</span>
          </div>
          <span className="font-bold text-slate-900 text-sm">₹{doctorFee}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Simulated hospital billing invoice created upon booking confirmation</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-bold text-slate-800">
          Reason for Visit / Symptoms (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Please describe symptoms, existing conditions, or concerns for the clinician..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-white border-slate-200 text-slate-900 rounded-xl h-28 text-sm focus-visible:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400">
          This confidential note will be accessible to the attending doctor.
        </p>
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Change Time
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Securing Slot...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
