"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Clock, ArrowLeft, Calendar, Receipt } from "lucide-react";
import { bookAppointment } from "@/actions/appointments";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

export function AppointmentForm({ doctorId, slot, onBack, onComplete }) {
  const [description, setDescription] = useState("");

  const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("doctorId", doctorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("description", description);

    await submitBooking(formData);
  };

  useEffect(() => {
    if (data) {
      if (data.success) {
        toast.success("Appointment booked successfully! Invoice generated.");
        onComplete();
      }
    }
  }, [data, onComplete]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Appointment Summary Card */}
      <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2.5">
        <div className="flex items-center text-slate-800 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <span>{format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center text-slate-700 text-sm">
          <Clock className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <span>{slot.formatted}</span>
        </div>
        <div className="flex items-center text-slate-700 text-sm">
          <Receipt className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
          <span>
            Billing: <strong className="text-slate-900 font-bold">Standard Consultation Fee</strong> (Itemized Invoice Generated)
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Describe your medical symptoms or concern (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Describe any symptoms, previous treatments, or questions for the doctor..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 rounded-xl h-28 text-sm"
        />
        <p className="text-xs text-slate-500">
          This confidential information will be shared with the clinician before your consultation.
        </p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Time Slot
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reserving Slot...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
