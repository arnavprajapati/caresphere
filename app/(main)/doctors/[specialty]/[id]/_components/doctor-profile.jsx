"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  Star,
  Mail,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Receipt,
} from "lucide-react";
import {
  bookAppointment,
  getAvailableTimeSlots,
} from "@/actions/appointments";
import { toast } from "sonner";

const ALL_SPECIALTIES = [
  "General Physician",
  "Dermatology",
  "Obstetrics & Gynaecology",
  "Orthopaedics",
  "ENT",
  "Neurology",
  "Cardiology",
  "Urology",
  "Gastroenterology/GI medicine",
  "Psychiatry",
  "Paediatrics",
  "Pulmonology/Respiratory",
  "Endocrinology",
  "Nephrology",
  "Neurosurgery",
  "Rheumatology",
  "Ophthalmology",
  "Surgical Gastroenterology",
  "Infectious Disease",
  "General & Laparoscopic Surgery",
  "Psychology",
  "Medical Oncology",
  "Diabetology",
  "Dentist",
];

export function DoctorProfile({ doctor, availableDays = [], allDoctors = [] }) {
  const router = useRouter();

  const [selectedSpecialty, setSelectedSpecialty] = useState(
    doctor?.specialty || "General Physician"
  );
  const [showMoreDoctors, setShowMoreDoctors] = useState(false);

  // Default to first day with slots, or first day
  const firstDay =
    availableDays?.find((d) => d.slots && d.slots.length > 0)?.date ||
    availableDays?.[0]?.date ||
    format(new Date(), "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState(firstDay);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [description, setDescription] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);

  if (!doctor) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Doctor not found</h2>
        <Link href="/doctors" className="text-blue-600 text-sm underline mt-2 inline-block">
          Return to Doctors List
        </Link>
      </div>
    );
  }

  const [liveDays, setLiveDays] = useState(availableDays || []);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setLiveDays(availableDays || []);
  }, [availableDays]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshLiveSlots = useCallback(async () => {
    if (!doctor?.id) return;
    try {
      const res = await getAvailableTimeSlots(doctor.id);
      if (res?.days) {
        setLiveDays(res.days);
      }
      setNowMs(Date.now());
    } catch {
      // Keep existing slots on transient refresh errors
    }
  }, [doctor?.id]);

  useEffect(() => {
    refreshLiveSlots();
    const onFocus = () => {
      refreshLiveSlots();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshLiveSlots();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshLiveSlots]);

  // Active non-blocked days with future open slots only
  const openDays = useMemo(() => {
    return (liveDays || [])
      .map((d) => ({
        ...d,
        slots: (d.slots || []).filter(
          (slot) => new Date(slot.startTime).getTime() > nowMs
        ),
      }))
      .filter((d) => !d.isBlocked && d.slots.length > 0);
  }, [liveDays, nowMs]);

  useEffect(() => {
    if (
      openDays.length > 0 &&
      !openDays.some((d) => d.date === selectedDate)
    ) {
      const firstOpenDay =
        openDays.find((d) => d.slots.some((s) => !s.isBooked)) || openDays[0];
      setSelectedDate(firstOpenDay.date);
      setSelectedSlot(null);
    }
  }, [openDays, selectedDate]);

  // Active day object
  const currentDaySlots =
    openDays.find((d) => d.date === selectedDate)?.slots || [];

  // Filter doctors of current specialty (case-insensitive)
  const specialtyDoctors = allDoctors.filter(
    (d) =>
      d.specialty &&
      d.specialty.trim().toLowerCase() === (selectedSpecialty || "").trim().toLowerCase()
  );

  const handleSelectSlot = (slot) => {
    if (slot.isBooked) {
      return;
    }
    if (new Date(slot.startTime).getTime() <= Date.now()) {
      toast.error("This time slot has already passed.");
      setSelectedSlot(null);
      refreshLiveSlots();
      return;
    }
    setSelectedSlot(slot);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select a time slot first");
      return;
    }

    if (new Date(selectedSlot.startTime).getTime() <= Date.now()) {
      toast.error("Cannot book a past time slot. Please choose an upcoming time.");
      setSelectedSlot(null);
      await refreshLiveSlots();
      return;
    }

    setBookingLoading(true);
    try {
      const formData = new FormData();
      formData.append("doctorId", doctor.id);
      formData.append("startTime", selectedSlot.startTime);
      formData.append("endTime", selectedSlot.endTime);
      formData.append("patientDescription", description);

      const res = await bookAppointment(formData);
      if (res?.success) {
        if (res.videoSessionReady) {
          toast.success(
            "Appointment booked with video session! Hospital invoice created."
          );
        } else {
          toast.success("Appointment booked and hospital invoice created.");
          if (res.videoWarning) {
            toast.warning(`Video session unavailable: ${res.videoWarning}`);
          }
        }
        router.push("/appointments");
      }
    } catch (error) {
      toast.error(error?.message || "Unable to complete booking right now.");
      setSelectedSlot(null);
      await refreshLiveSlots();
    } finally {
      setBookingLoading(false);
    }
  };

  const doctorFee = doctor?.consultationFee || 500;
  const doctorDisplayName = (doctor?.name || "Doctor").replace(/^Dr\.\s*/i, "");
  const formatSpecialtyLowerFirst = (value) =>
    value ? value.charAt(0).toLowerCase() + value.slice(1) : "";
  const doctorSpecialtyLabel = formatSpecialtyLowerFirst(
    doctor.specialty || selectedSpecialty
  );

  return (
    <div className="w-full bg-white dark:bg-slate-950 pt-3 pb-10 space-y-6">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
        Book Your Appointment
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Choosen Specialty
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="flex flex-wrap gap-2.5">
                {ALL_SPECIALTIES.map((spec) => {
                  const isSelected =
                    (selectedSpecialty || "").trim().toLowerCase() ===
                    spec.trim().toLowerCase();
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`text-sm px-3.5 py-2 rounded-md font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-100 font-semibold"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Select your doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-4">
              <div className="p-4 sm:p-5 rounded-lg border border-slate-900 dark:border-slate-200 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {doctor.imageUrl ? (
                      <img
                        src={doctor.imageUrl}
                        alt={doctorDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                      Dr. {doctorDisplayName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {doctorSpecialtyLabel} &bull; {doctor.qualification || "MBBS"}
                    </p>
                    <div className="flex items-center text-amber-500 text-sm font-bold pt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
                      <span>5</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm text-slate-400 font-medium">Fee</span>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">₹{doctorFee}</p>
                </div>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowMoreDoctors(!showMoreDoctors)}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showMoreDoctors ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Show more</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {showMoreDoctors && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Other {formatSpecialtyLowerFirst(selectedSpecialty)} Specialists:
                  </p>
                  {specialtyDoctors.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">
                      No other verified doctors in {formatSpecialtyLowerFirst(selectedSpecialty)} right now.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {specialtyDoctors.map((doc) => {
                        const docName = (doc?.name || "Doctor").replace(/^Dr\.\s*/i, "");
                        return (
                          <Link
                            key={doc.id}
                            href={`/doctors/${encodeURIComponent(
                              doc.specialty || selectedSpecialty
                            )}/${doc.id}`}
                            className={`p-3.5 rounded-lg border flex items-center justify-between transition-all ${
                              doc.id === doctor.id
                                ? "border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-900"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  Dr. {docName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {doc.qualification || "MBBS"} • ₹{doc.consultationFee || 500} • {doc.experience || 3} yrs
                                </p>
                              </div>
                            </div>
                            {doc.id === doctor.id && (
                              <Check className="h-4 w-4 text-slate-900 dark:text-slate-100" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Choose Date & Time */}
          <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Choose Date & Time
                </CardTitle>
                {openDays.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <span>{selectedDate}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-6">
              {openDays.length === 0 ? (
                <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                  <Clock className="h-9 w-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Slots Available
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Dr. {doctorDisplayName} currently has no available appointment slots. Please check back later.
                  </p>
                </div>
              ) : (
                <>
                  {/* Horizontal Date Selector (Thu 10, Fri 11, etc.) */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                    {openDays.map((day) => {
                      const dateObj = new Date(`${day.date}T00:00:00`);
                      const isSelected = selectedDate === day.date;
                      const dayName = format(dateObj, "EEE"); // Thu, Fri
                      const dayNum = format(dateObj, "d"); // 10, 11

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.date);
                            setSelectedSlot(null);
                          }}
                          className={`min-w-[74px] py-3 px-3.5 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              isSelected ? "text-slate-300 dark:text-slate-600" : "text-slate-400"
                            }`}
                          >
                            {dayName}
                          </span>
                          <span className="text-xl font-extrabold mt-0.5">
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Available Time Slots Grid */}
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Consultation Slots ({currentDaySlots.filter((s) => !s.isBooked).length} available)
                      </h4>
                      {selectedSlot && (
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">
                          Selected: {selectedSlot.formatted}
                        </span>
                      )}
                    </div>

                    {currentDaySlots.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                        No open slots available for this date. Please select another day above.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {currentDaySlots.map((slot) => {
                          const isBooked = Boolean(slot.isBooked);
                          const isSlotSelected =
                            !isBooked && selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={slot.startTime}
                              type="button"
                              disabled={isBooked}
                              title={isBooked ? "Already booked" : "Available"}
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-3 px-4 rounded-md border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                isBooked
                                  ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
                                  : isSlotSelected
                                  ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 cursor-pointer"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className={isBooked ? "line-through" : ""}>
                                {format(new Date(slot.startTime), "h:mm a")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Booking Form if slot selected */}
                  {selectedSlot && (
                    <form
                      onSubmit={handleBookingSubmit}
                      className="space-y-5 pt-5 border-t border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                            Confirming: {format(new Date(selectedSlot.startTime), "EEEE, MMM d")} at {selectedSlot.formatted}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Attending Doctor: Dr. {doctorDisplayName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">Total Fee</span>
                          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">₹{doctorFee}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="symptoms"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Reason for Consultation / Symptoms (Optional)
                        </Label>
                        <Textarea
                          id="symptoms"
                          rows={3}
                          placeholder="Share any specific symptoms or health questions for the doctor..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm p-3"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-black hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold rounded-md h-12 text-sm sm:text-base shadow-none transition-colors"
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming Your Slot...
                          </>
                        ) : (
                          `Confirm & Book Appointment (₹${doctorFee})`
                        )}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-none overflow-hidden">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-blue-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    {doctor.imageUrl ? (
                      <img
                        src={doctor.imageUrl}
                        alt={doctorDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Dr. {doctorDisplayName}
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                    {doctorSpecialtyLabel}
                  </p>

                  <div className="flex items-center text-amber-500 text-sm font-bold mb-5">
                    <Star className="h-4 w-4 fill-amber-400 mr-1" />
                    <span>5</span>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <a
                      href={doctor.email ? `mailto:${doctor.email}` : "#"}
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info(`Doctor contact helpline: +91 98765 43210`)
                      }
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                      title="Doctor Helpline"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Live consultation chat unlocks once appointment starts")
                      }
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                      title="Chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
