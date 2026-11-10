"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
  CalendarClock,
  FileText,
  Plus,
  Trash2,
  Pill,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  markAppointmentCompleted,
} from "@/actions/doctor";
import {
  generateVideoToken,
  getAvailableTimeSlots,
  rescheduleAppointment,
} from "@/actions/appointments";
import { saveVisitRecord } from "@/actions/visits";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const REPORT_TYPES = ["Lab Test", "Radiology", "Pathology", "Cardiology", "Other"];
const REPORT_STATUSES = ["ORDERED", "PENDING", "COMPLETED"];

const createEmptyPrescription = () => ({
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const createEmptyReport = () => ({
  reportTitle: "",
  reportType: "Lab Test",
  status: "ORDERED",
  reportDate: "",
  referenceCode: "",
  summary: "",
});

function mapVisitToForm(visitRecord, fallbackNotes = "") {
  return {
    symptoms: visitRecord?.symptoms || "",
    diagnosis: visitRecord?.diagnosis || "",
    clinicianNotes: visitRecord?.clinicianNotes ?? fallbackNotes ?? "",
    followUpDate: visitRecord?.followUpDate
      ? format(new Date(visitRecord.followUpDate), "yyyy-MM-dd")
      : "",
    prescriptions: (visitRecord?.prescriptions || []).map((p) => ({
      medicineName: p.medicineName || "",
      dosage: p.dosage || "",
      frequency: p.frequency || "",
      duration: p.duration || "",
      instructions: p.instructions || "",
    })),
    diagnosticReports: (visitRecord?.diagnosticReports || []).map((r) => ({
      reportTitle: r.reportTitle || "",
      reportType: r.reportType || "Lab Test",
      status: r.status || "ORDERED",
      reportDate: r.reportDate ? format(new Date(r.reportDate), "yyyy-MM-dd") : "",
      referenceCode: r.referenceCode || "",
      summary: r.summary || "",
    })),
  };
}

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // 'visit', 'reschedule', 'video'
  const router = useRouter();

  const [visitForm, setVisitForm] = useState(() =>
    mapVisitToForm(appointment.visitRecord, appointment.notes)
  );

  // Reschedule state
  const [rescheduleDays, setRescheduleDays] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState(null);

  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);

  const {
    loading: visitLoading,
    fn: submitVisitRecord,
    data: visitData,
  } = useFetch(saveVisitRecord);

  const {
    loading: rescheduleLoading,
    fn: submitReschedule,
    data: rescheduleData,
  } = useFetch(rescheduleAppointment);

  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);

  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  const activeVisitRecord = visitData?.visitRecord ?? appointment.visitRecord ?? null;

  useEffect(() => {
    setVisitForm(mapVisitToForm(activeVisitRecord, appointment.notes));
  }, [activeVisitRecord, appointment.notes]);

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  const canMarkCompleted = () => {
    if (
      userRole !== "DOCTOR" ||
      !["SCHEDULED", "IN_PROGRESS"].includes(appointment.status)
    ) {
      return false;
    }
    return new Date() >= new Date(appointment.endTime);
  };

  const refreshView = () => {
    if (refetchAppointments) {
      refetchAppointments();
    } else {
      router.refresh();
    }
  };

  const handleCancelAppointment = async () => {
    if (cancelLoading) return;
    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitCancel(formData);
    }
  };

  const handleMarkCompleted = async () => {
    if (completeLoading) return;
    if (new Date() < new Date(appointment.endTime)) {
      toast.error("Cannot mark appointment as completed before the scheduled end time.");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitMarkCompleted(formData);
    }
  };

  const handleSaveVisitRecord = async () => {
    if (visitLoading || userRole !== "DOCTOR") return;

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("symptoms", visitForm.symptoms);
    formData.append("diagnosis", visitForm.diagnosis);
    formData.append("clinicianNotes", visitForm.clinicianNotes);
    if (visitForm.followUpDate) {
      formData.append("followUpDate", visitForm.followUpDate);
    }
    formData.append(
      "medicines",
      JSON.stringify(visitForm.prescriptions.filter((p) => p.medicineName.trim()))
    );
    formData.append(
      "diagnosticReports",
      JSON.stringify(visitForm.diagnosticReports.filter((r) => r.reportTitle.trim()))
    );
    await submitVisitRecord(formData);
  };

  const handleOpenReschedule = async () => {
    setAction("reschedule");
    setRescheduleSlot(null);
    setSlotsLoading(true);
    try {
      const res = await getAvailableTimeSlots(appointment.doctorId);
      const nowMs = Date.now();
      const filteredDays = (res?.days || [])
        .map((d) => ({
          ...d,
          slots: (d.slots || []).filter(
            (slot) => new Date(slot.startTime).getTime() > nowMs
          ),
        }))
        .filter((d) => !d.isBlocked && d.slots.length > 0);
      setRescheduleDays(filteredDays);
      setRescheduleDate(filteredDays[0]?.date || "");
    } catch {
      toast.error("Unable to load available slots right now.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (rescheduleLoading || !rescheduleSlot) return;
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("startTime", rescheduleSlot.startTime);
    formData.append("endTime", rescheduleSlot.endTime);
    await submitReschedule(formData);
  };

  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;
    setAction("video");
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitTokenRequest(formData);
  };

  useEffect(() => {
    if (cancelData?.success) {
      toast.success("Appointment cancelled successfully");
      setOpen(false);
      refreshView();
    }
  }, [cancelData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (completeData?.success) {
      toast.success("Appointment marked as completed");
      setOpen(false);
      refreshView();
    }
  }, [completeData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visitData?.success) {
      toast.success("Visit record and diagnostic report metadata saved");
      setAction(null);
      refreshView();
    }
  }, [visitData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rescheduleData?.success) {
      toast.success("Appointment rescheduled successfully");
      setAction(null);
      setRescheduleSlot(null);
      setOpen(false);
      refreshView();
    }
  }, [rescheduleData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tokenData?.success) {
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`
      );
    } else if (tokenData?.error) {
      setAction(null);
    }
  }, [tokenData, appointment.id, router]);

  const rescheduleDaySlots = useMemo(() => {
    return (
      rescheduleDays.find((d) => d.date === rescheduleDate)?.slots || []
    );
  }, [rescheduleDays, rescheduleDate]);

  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);
    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  const isStaffViewer = userRole === "FRONT_DESK" || userRole === "ADMIN";
  const otherParty =
    userRole === "DOCTOR" || isStaffViewer
      ? appointment.patient || appointment.doctor || {}
      : appointment.doctor || appointment.patient || {};

  const otherPartyLabel =
    userRole === "DOCTOR" || isStaffViewer ? "Patient" : "Doctor";
  const otherPartyIcon =
    userRole === "DOCTOR" || isStaffViewer ? (
      <User className="h-5 w-5" />
    ) : (
      <Stethoscope className="h-5 w-5" />
    );

  const statusLabel =
    appointment.status === "IN_PROGRESS" ? "CHECKED IN" : appointment.status;

  const statusBadgeClass =
    appointment.status === "COMPLETED" || appointment.status === "IN_PROGRESS"
      ? "bg-black border-black text-white text-xs px-3 py-1 rounded-md font-semibold"
      : appointment.status === "CANCELLED"
      ? "bg-slate-200 border-slate-300 text-slate-800 text-xs px-3 py-1 rounded-md font-semibold"
      : "bg-slate-100 border-slate-300 text-black text-xs px-3 py-1 rounded-md font-semibold";

  const existingPrescriptions = activeVisitRecord?.prescriptions || [];
  const existingReports = activeVisitRecord?.diagnosticReports || [];
  const hasClinicalData = Boolean(
    activeVisitRecord?.clinicianNotes ||
      activeVisitRecord?.symptoms ||
      activeVisitRecord?.diagnosis ||
      activeVisitRecord?.followUpDate ||
      existingPrescriptions.length > 0 ||
      existingReports.length > 0
  );

  return (
    <>
      <Card className="bg-white text-black border border-slate-200 hover:border-slate-400 rounded-lg overflow-hidden shadow-none transition-all py-0 gap-0 flex flex-col justify-between h-full">
        <div>
          <div className="h-28 bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#0f296b]" />

          <div className="px-6 flex items-end justify-between gap-3">
            <div className="-mt-12 w-24 h-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
              {otherParty.imageUrl ? (
                <img
                  src={otherParty.imageUrl}
                  alt={otherParty.name || otherPartyLabel}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-700">{otherPartyIcon}</span>
              )}
            </div>

            <Badge variant="outline" className={`${statusBadgeClass} mb-1`}>
              {statusLabel}
            </Badge>
          </div>

          <div className="px-6 pt-3 pb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug">
                {userRole === "DOCTOR" || isStaffViewer
                  ? otherParty.name || "Patient"
                  : `Dr. ${otherParty.name || "Doctor"}`}
              </h3>
              {(userRole === "DOCTOR" || isStaffViewer) && otherParty.email && (
                <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
                  {otherParty.email}
                </p>
              )}
              {userRole === "PATIENT" && otherParty.specialty && (
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {otherParty.specialty}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Date:</span>{" "}
                {format(new Date(appointment.startTime), "MMMM d, yyyy")}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Time:</span>{" "}
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </p>
              {isStaffViewer && appointment.doctor ? (
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Doctor:</span>{" "}
                  Dr. {appointment.doctor.name}
                  {appointment.doctor.specialty
                    ? ` (${appointment.doctor.specialty})`
                    : ""}
                </p>
              ) : (
                <p className="truncate">
                  <span className="font-semibold text-slate-800">Type:</span>{" "}
                  Video / Clinic Consultation
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            {isStaffViewer && appointment.invoice ? (
              <Badge
                variant="outline"
                className={
                  appointment.invoice.status === "PAID"
                    ? "bg-black border-black text-white text-xs px-2.5 py-1 rounded-md font-semibold"
                    : "bg-white border-slate-300 text-black text-xs px-2.5 py-1 rounded-md font-semibold"
                }
              >
                ₹{appointment.invoice.totalAmount} &bull; {appointment.invoice.status}
              </Badge>
            ) : (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {otherPartyLabel} Visit
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canMarkCompleted() && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkCompleted}
                disabled={completeLoading}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-10 px-3.5 cursor-pointer"
              >
                {completeLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Complete
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-black text-white font-semibold rounded-md px-5 h-10 text-sm shadow-none cursor-pointer transition-colors"
              onClick={() => {
                setAction(null);
                setOpen(true);
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setAction(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white border border-slate-200 text-black rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Appointment Details
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {appointment.status === "SCHEDULED"
                ? "Manage upcoming appointment details, reschedule, or review clinical records"
                : "View appointment information and clinical records"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Party Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {otherPartyLabel}
                </h4>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 text-black flex items-center justify-center shrink-0">
                    {otherPartyIcon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-black font-bold text-sm truncate">
                      {userRole === "DOCTOR" || isStaffViewer
                        ? otherParty.name || "Patient"
                        : `Dr. ${otherParty.name || "Doctor"}`}
                    </p>
                    {(userRole === "DOCTOR" || isStaffViewer) && otherParty.email && (
                      <p className="text-slate-600 text-xs truncate">
                        {otherParty.email}
                      </p>
                    )}
                    {userRole === "PATIENT" && otherParty.specialty && (
                      <p className="text-slate-600 text-xs font-medium">
                        {otherParty.specialty}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isStaffViewer && appointment.doctor && (
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Doctor
                  </h4>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200 text-black flex items-center justify-center shrink-0">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-black font-bold text-sm truncate">
                        Dr. {appointment.doctor.name}
                      </p>
                      {appointment.doctor.specialty && (
                        <p className="text-slate-600 text-xs font-medium truncate">
                          {appointment.doctor.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Time & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="space-y-1 text-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Scheduled Time
                </h4>
                <div className="flex items-center text-black font-semibold text-xs sm:text-sm">
                  <Calendar className="h-4 w-4 text-black mr-2 shrink-0" />
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>
                <div className="flex items-center text-slate-600 text-xs">
                  <Clock className="h-3.5 w-3.5 text-slate-500 mr-2 shrink-0" />
                  <span>
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </span>
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </h4>
                <Badge variant="outline" className={statusBadgeClass}>
                  {statusLabel}
                </Badge>
              </div>
            </div>

            {/* Reschedule Picker Panel */}
            {action === "reschedule" && appointment.status === "SCHEDULED" && (
              <div className="p-4 rounded-md bg-slate-50 border border-slate-300 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    Select New Date &amp; Time Slot
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAction(null);
                      setRescheduleSlot(null);
                    }}
                    className="h-7 text-xs text-slate-600 hover:text-black cursor-pointer"
                  >
                    Close
                  </Button>
                </div>

                {slotsLoading ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots...
                  </div>
                ) : rescheduleDays.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-600 py-3">
                    No upcoming open slots are available for this doctor right now.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {rescheduleDays.map((day) => {
                        const dateObj = new Date(`${day.date}T00:00:00`);
                        const selected = rescheduleDate === day.date;
                        return (
                          <button
                            key={day.date}
                            type="button"
                            onClick={() => {
                              setRescheduleDate(day.date);
                              setRescheduleSlot(null);
                            }}
                            className={`min-w-[66px] py-2 px-3 rounded-md border text-center cursor-pointer transition-colors ${
                              selected
                                ? "bg-black border-black text-white font-bold"
                                : "bg-white border-slate-300 text-black hover:bg-slate-100"
                            }`}
                          >
                            <span className="block text-[10px] uppercase opacity-75">
                              {format(dateObj, "EEE")}
                            </span>
                            <span className="block text-sm font-bold">
                              {format(dateObj, "d")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {rescheduleDaySlots.map((slot) => {
                        const isCurrentSlot =
                          new Date(slot.startTime).getTime() ===
                          new Date(appointment.startTime).getTime();
                        const disabled = Boolean(slot.isBooked) || isCurrentSlot;
                        const isSelected =
                          !disabled && rescheduleSlot?.startTime === slot.startTime;

                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={disabled}
                            onClick={() => setRescheduleSlot(slot)}
                            className={`py-2 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors ${
                              disabled
                                ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed line-through"
                                : isSelected
                                ? "bg-black border-black text-white"
                                : "bg-white border-slate-300 text-black hover:bg-slate-100"
                            }`}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAction(null);
                          setRescheduleSlot(null);
                        }}
                        disabled={rescheduleLoading}
                        className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!rescheduleSlot || rescheduleLoading}
                        onClick={handleConfirmReschedule}
                        className="rounded-md bg-black hover:bg-neutral-900 text-white cursor-pointer shadow-none"
                      >
                        {rescheduleLoading ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Rescheduling...
                          </>
                        ) : (
                          "Confirm Reschedule"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Patient Description */}
            {appointment.patientDescription && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {userRole === "DOCTOR" || isStaffViewer
                    ? "Patient Description"
                    : "Your Description"}
                </h4>
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                  <p className="text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Join Video Call Button (Patient & Doctor only) */}
            {["SCHEDULED", "IN_PROGRESS"].includes(appointment.status) &&
              !isStaffViewer && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Video Consultation
                  </h4>
                  <Button
                    className="w-full bg-black hover:bg-neutral-900 text-white rounded-md font-semibold h-10 cursor-pointer shadow-none"
                    disabled={
                      !isAppointmentActive() || action === "video" || tokenLoading
                    }
                    onClick={handleJoinVideoCall}
                  >
                    {tokenLoading || action === "video" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing Video Call...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        {isAppointmentActive()
                          ? "Join Video Call"
                          : "Video call will be available 30 minutes before appointment"}
                      </>
                    )}
                  </Button>
                </div>
              )}

            {/* Visit Record, Prescriptions & Diagnostic Report Metadata (hidden from Front-Desk) */}
            {userRole !== "FRONT_DESK" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Clinical Visit Record &amp; Diagnostic Reports
                  </h4>
                  {userRole === "DOCTOR" &&
                    action !== "visit" &&
                    appointment.status !== "CANCELLED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAction("visit")}
                        className="h-8 bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold cursor-pointer rounded-md"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        {hasClinicalData ? "Edit Visit & Reports" : "Add Visit & Reports"}
                      </Button>
                    )}
                </div>

                {userRole === "DOCTOR" && action === "visit" ? (
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-300 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-black">
                          Symptoms
                        </Label>
                        <Input
                          value={visitForm.symptoms}
                          onChange={(e) =>
                            setVisitForm((prev) => ({
                              ...prev,
                              symptoms: e.target.value,
                            }))
                          }
                          placeholder="e.g. Fever, sore throat for 3 days"
                          className="bg-white border-slate-300 text-black rounded-md text-sm h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-black">
                          Clinician Diagnosis
                        </Label>
                        <Input
                          value={visitForm.diagnosis}
                          onChange={(e) =>
                            setVisitForm((prev) => ({
                              ...prev,
                              diagnosis: e.target.value,
                            }))
                          }
                          placeholder="e.g. Viral pharyngitis"
                          className="bg-white border-slate-300 text-black rounded-md text-sm h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 min-w-0 space-y-1">
                        <Label className="text-xs font-bold text-black">
                          Clinician Notes &amp; Advice
                        </Label>
                        <Textarea
                          value={visitForm.clinicianNotes}
                          onChange={(e) =>
                            setVisitForm((prev) => ({
                              ...prev,
                              clinicianNotes: e.target.value,
                            }))
                          }
                          placeholder="Clinical findings, instructions, and follow-up guidance..."
                          className="w-full bg-white border-slate-300 text-black rounded-md min-h-[80px] text-sm"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label className="text-xs font-bold text-black">
                          Follow-Up Date
                        </Label>
                        <Input
                          type="date"
                          value={visitForm.followUpDate}
                          onChange={(e) =>
                            setVisitForm((prev) => ({
                              ...prev,
                              followUpDate: e.target.value,
                            }))
                          }
                          className="w-full min-w-0 bg-white border-slate-300 text-black rounded-md text-sm h-9"
                        />
                      </div>
                    </div>

                    {/* Prescriptions Editor */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5" />
                          Prescriptions ({visitForm.prescriptions.length})
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setVisitForm((prev) => ({
                              ...prev,
                              prescriptions: [
                                ...prev.prescriptions,
                                createEmptyPrescription(),
                              ],
                            }))
                          }
                          className="h-7 px-2.5 text-xs bg-white border-slate-300 text-black hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Medicine
                        </Button>
                      </div>

                      {visitForm.prescriptions.map((med, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-md bg-white border border-slate-200 items-center"
                        >
                          <Input
                            placeholder="Medicine *"
                            value={med.medicineName}
                            onChange={(e) =>
                              setVisitForm((prev) => ({
                                ...prev,
                                prescriptions: prev.prescriptions.map((item, i) =>
                                  i === idx
                                    ? { ...item, medicineName: e.target.value }
                                    : item
                                ),
                              }))
                            }
                            className="sm:col-span-4 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                          />
                          <Input
                            placeholder="Dosage (500mg)"
                            value={med.dosage}
                            onChange={(e) =>
                              setVisitForm((prev) => ({
                                ...prev,
                                prescriptions: prev.prescriptions.map((item, i) =>
                                  i === idx ? { ...item, dosage: e.target.value } : item
                                ),
                              }))
                            }
                            className="sm:col-span-2 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                          />
                          <Input
                            placeholder="Frequency"
                            value={med.frequency}
                            onChange={(e) =>
                              setVisitForm((prev) => ({
                                ...prev,
                                prescriptions: prev.prescriptions.map((item, i) =>
                                  i === idx
                                    ? { ...item, frequency: e.target.value }
                                    : item
                                ),
                              }))
                            }
                            className="sm:col-span-3 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                          />
                          <Input
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) =>
                              setVisitForm((prev) => ({
                                ...prev,
                                prescriptions: prev.prescriptions.map((item, i) =>
                                  i === idx
                                    ? { ...item, duration: e.target.value }
                                    : item
                                ),
                              }))
                            }
                            className="sm:col-span-2 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setVisitForm((prev) => ({
                                ...prev,
                                prescriptions: prev.prescriptions.filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            className="sm:col-span-1 h-8 w-8 p-0 text-slate-500 hover:text-black cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Diagnostic Reports Metadata Editor */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Diagnostic Reports Metadata ({visitForm.diagnosticReports.length})
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setVisitForm((prev) => ({
                              ...prev,
                              diagnosticReports: [
                                ...prev.diagnosticReports,
                                createEmptyReport(),
                              ],
                            }))
                          }
                          className="h-7 px-2.5 text-xs bg-white border-slate-300 text-black hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Report
                        </Button>
                      </div>

                      {visitForm.diagnosticReports.map((rep, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-md bg-white border border-slate-200 space-y-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Input
                              placeholder="Report Title * (e.g. Complete Blood Count)"
                              value={rep.reportTitle}
                              onChange={(e) =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                    i === idx
                                      ? { ...item, reportTitle: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="sm:col-span-5 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                            />
                            <div className="sm:col-span-3">
                              <Select
                                value={rep.reportType}
                                onValueChange={(val) =>
                                  setVisitForm((prev) => ({
                                    ...prev,
                                    diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                      i === idx ? { ...item, reportType: val } : item
                                    ),
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full !h-8 text-xs bg-white border-slate-300 text-black rounded-md shadow-none cursor-pointer">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  {REPORT_TYPES.map((t) => (
                                    <SelectItem key={t} value={t} className="text-xs cursor-pointer">
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="sm:col-span-3">
                              <Select
                                value={rep.status}
                                onValueChange={(val) =>
                                  setVisitForm((prev) => ({
                                    ...prev,
                                    diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                      i === idx ? { ...item, status: val } : item
                                    ),
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full !h-8 text-xs bg-white border-slate-300 text-black rounded-md shadow-none cursor-pointer">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  {REPORT_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs cursor-pointer">
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  diagnosticReports: prev.diagnosticReports.filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                              className="sm:col-span-1 h-8 w-8 p-0 text-slate-500 hover:text-black cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <Input
                              type="date"
                              value={rep.reportDate}
                              onChange={(e) =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                    i === idx ? { ...item, reportDate: e.target.value } : item
                                  ),
                                }))
                              }
                              className="sm:col-span-4 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                            />
                            <Input
                              placeholder="Ref Code (optional)"
                              value={rep.referenceCode}
                              onChange={(e) =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                    i === idx
                                      ? { ...item, referenceCode: e.target.value }
                                      : item
                                  ),
                                }))
                              }
                              className="sm:col-span-3 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                            />
                            <Input
                              placeholder="Report summary / notes (clinician entered)"
                              value={rep.summary}
                              onChange={(e) =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  diagnosticReports: prev.diagnosticReports.map((item, i) =>
                                    i === idx ? { ...item, summary: e.target.value } : item
                                  ),
                                }))
                              }
                              className="sm:col-span-5 h-8 text-xs bg-white border-slate-300 text-black rounded-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAction(null);
                          setVisitForm(mapVisitToForm(activeVisitRecord, appointment.notes));
                        }}
                        disabled={visitLoading}
                        className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveVisitRecord}
                        disabled={visitLoading}
                        className="bg-black hover:bg-neutral-900 text-white rounded-md cursor-pointer shadow-none"
                      >
                        {visitLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Visit & Reports"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                    {!hasClinicalData ? (
                      <p className="text-slate-500 text-sm font-semi-bold">
                        No clinical visit notes or diagnostic reports recorded yet.
                      </p>
                    ) : (
                      <>
                        {(activeVisitRecord?.symptoms || activeVisitRecord?.diagnosis) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                            {activeVisitRecord?.symptoms && (
                              <div>
                                <span className="font-bold text-slate-600 block text-[11px] uppercase">
                                  Symptoms
                                </span>
                                <span className="text-black">
                                  {activeVisitRecord.symptoms}
                                </span>
                              </div>
                            )}
                            {activeVisitRecord?.diagnosis && (
                              <div>
                                <span className="font-bold text-slate-600 block text-[11px] uppercase">
                                  Diagnosis
                                </span>
                                <span className="text-black font-semibold">
                                  {activeVisitRecord.diagnosis}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {activeVisitRecord?.clinicianNotes && (
                          <div>
                            <span className="font-bold text-slate-600 block text-[11px] uppercase mb-0.5">
                              Clinician Notes
                            </span>
                            <p className="text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                              {activeVisitRecord.clinicianNotes}
                            </p>
                          </div>
                        )}

                        {activeVisitRecord?.followUpDate && (
                          <p className="text-xs text-slate-700 font-medium">
                            Follow-up Date:{" "}
                            <span className="font-bold text-black">
                              {format(new Date(activeVisitRecord.followUpDate), "MMMM d, yyyy")}
                            </span>
                          </p>
                        )}

                        {existingPrescriptions.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-1.5">
                            <span className="font-bold text-slate-600 block text-[11px] uppercase">
                              Prescriptions ({existingPrescriptions.length})
                            </span>
                            <div className="space-y-1">
                              {existingPrescriptions.map((med, i) => (
                                <div
                                  key={med.id || i}
                                  className="text-xs bg-white border border-slate-200 rounded-md px-3 py-2 flex flex-wrap justify-between gap-2"
                                >
                                  <span className="font-bold text-black">
                                    {med.medicineName} ({med.dosage})
                                  </span>
                                  <span className="text-slate-600">
                                    {med.frequency} &bull; {med.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {existingReports.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-1.5">
                            <span className="font-bold text-slate-600 block text-[11px] uppercase">
                              Diagnostic Reports ({existingReports.length})
                            </span>
                            <div className="space-y-1.5">
                              {existingReports.map((rep, i) => (
                                <div
                                  key={rep.id || i}
                                  className="text-xs bg-white border border-slate-200 rounded-md p-2.5 space-y-1"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-black">
                                      {rep.reportTitle}
                                      <span className="font-normal text-slate-600">
                                        {" "}
                                        ({rep.reportType})
                                      </span>
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        rep.status === "COMPLETED"
                                          ? "bg-black border-black text-white text-[10px] rounded-md"
                                          : "bg-slate-100 border-slate-300 text-black text-[10px] rounded-md"
                                      }
                                    >
                                      {rep.status}
                                    </Badge>
                                  </div>
                                  {(rep.reportDate || rep.referenceCode) && (
                                    <p className="text-[11px] text-slate-500">
                                      {rep.reportDate
                                        ? `Date: ${format(new Date(rep.reportDate), "MMM d, yyyy")}`
                                        : ""}
                                      {rep.reportDate && rep.referenceCode ? " • " : ""}
                                      {rep.referenceCode ? `Ref: ${rep.referenceCode}` : ""}
                                    </p>
                                  )}
                                  {rep.summary && (
                                    <p className="text-slate-700">{rep.summary}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {canMarkCompleted() && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs font-semibold h-9 px-4 cursor-pointer shadow-none"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {appointment.status === "SCHEDULED" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenReschedule}
                    disabled={rescheduleLoading || cancelLoading}
                    className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-4 cursor-pointer"
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelAppointment}
                    disabled={cancelLoading || rescheduleLoading}
                    className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-4 cursor-pointer"
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel Appointment
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={() => setOpen(false)}
              className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold h-9 px-5 cursor-pointer shadow-none"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
