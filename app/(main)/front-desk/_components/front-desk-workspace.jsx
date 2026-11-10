"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PlusCircle,
  Search,
  UserPlus,
  Calendar,
  Clock,
  Check,
  Loader2,
  X,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  bookAppointment,
  getAvailableTimeSlots,
} from "@/actions/appointments";
import {
  searchPatients,
  registerWalkInPatient,
  checkInAppointment,
} from "@/actions/front-desk";

export function FrontDeskWorkspace({
  initialPatients = [],
  doctors = [],
  specialties = [],
  todayAppointments = [],
}) {
  const router = useRouter();

  // Queue state synced with server props
  const [queue, setQueue] = useState(todayAppointments);
  const [checkingInId, setCheckingInId] = useState(null);

  useEffect(() => {
    setQueue(todayAppointments);
  }, [todayAppointments]);

  // Booking panel visibility
  const [showBooking, setShowBooking] = useState(false);

  // Patient search & walk-in registration state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState(initialPatients);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regGender, setRegGender] = useState("");
  const [registering, setRegistering] = useState(false);

  // Specialty, doctor, and slots state
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [rawAvailableDays, setRawAvailableDays] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientDescription, setPatientDescription] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const availableDays = useMemo(() => {
    return (rawAvailableDays || [])
      .map((d) => ({
        ...d,
        slots: (d.slots || []).filter(
          (slot) => new Date(slot.startTime).getTime() > nowMs
        ),
      }))
      .filter((d) => !d.isBlocked && d.slots.length > 0);
  }, [rawAvailableDays, nowMs]);

  useEffect(() => {
    if (
      availableDays.length > 0 &&
      !availableDays.some((d) => d.date === selectedDate)
    ) {
      const firstOpenDay =
        availableDays.find((d) => d.slots.some((s) => !s.isBooked)) ||
        availableDays[0];
      setSelectedDate(firstOpenDay.date);
      setSelectedSlot(null);
    }
  }, [availableDays, selectedDate]);

  // Merge static SPECIALTIES names with any specialty found on verified doctors
  const departmentOptions = useMemo(() => {
    const set = new Set(specialties.filter(Boolean));
    doctors.forEach((doc) => {
      if (doc.specialty) set.add(doc.specialty);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [specialties, doctors]);

  const filteredDoctors = useMemo(() => {
    if (selectedDepartment === "ALL") return doctors;
    return doctors.filter(
      (doc) =>
        (doc.specialty || "").trim().toLowerCase() ===
        selectedDepartment.trim().toLowerCase()
    );
  }, [doctors, selectedDepartment]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  // Debounced server patient search
  useEffect(() => {
    if (!showBooking) return;
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await searchPatients(patientQuery);
        if (res?.success) {
          setPatientResults(res.patients || []);
        }
      } catch {
        // Keep current list on transient search error
      } finally {
        setSearchingPatients(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [patientQuery, showBooking]);

  // Clear selected doctor if department changes and doctor is outside department
  useEffect(() => {
    if (
      selectedDoctorId &&
      !filteredDoctors.some((d) => d.id === selectedDoctorId)
    ) {
      setSelectedDoctorId("");
      setRawAvailableDays([]);
      setSelectedDate("");
      setSelectedSlot(null);
    }
  }, [filteredDoctors, selectedDoctorId]);

  const refreshDoctorSlots = useCallback(async (doctorIdToLoad) => {
    if (!doctorIdToLoad) {
      setRawAvailableDays([]);
      setSelectedDate("");
      setSelectedSlot(null);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await getAvailableTimeSlots(doctorIdToLoad);
      setRawAvailableDays(res?.days || []);
      setNowMs(Date.now());
    } catch {
      setRawAvailableDays([]);
      setSelectedDate("");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // Load real doctor slots when doctor changes
  useEffect(() => {
    refreshDoctorSlots(selectedDoctorId);
  }, [selectedDoctorId, refreshDoctorSlots]);

  useEffect(() => {
    if (!showBooking || !selectedDoctorId) return;
    const onFocus = () => {
      refreshDoctorSlots(selectedDoctorId);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [showBooking, selectedDoctorId, refreshDoctorSlots]);

  const currentDaySlots = useMemo(() => {
    return availableDays.find((d) => d.date === selectedDate)?.slots || [];
  }, [availableDays, selectedDate]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (registering) return;

    setRegistering(true);
    try {
      const formData = new FormData();
      formData.append("name", regName);
      formData.append("email", regEmail);
      formData.append("phone", regPhone);
      if (regGender) formData.append("gender", regGender);

      const res = await registerWalkInPatient(formData);
      if (res?.success && res.patient) {
        setPatientResults((prev) => [res.patient, ...prev]);
        setSelectedPatient(res.patient);
        setShowRegisterForm(false);
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegGender("");
        toast.success(`Registered patient ${res.patient.name} successfully.`);
        router.refresh();
      }
    } catch (error) {
      toast.error(error?.message || "Failed to register patient.");
    } finally {
      setRegistering(false);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (bookingSubmitting) return;

    if (!selectedPatient) {
      toast.error("Please select or register a patient first.");
      return;
    }
    if (!selectedDoctor) {
      toast.error("Please select a doctor.");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select an available time slot.");
      return;
    }
    if (new Date(selectedSlot.startTime).getTime() <= Date.now()) {
      toast.error("Cannot book a past time slot. Please choose an upcoming time.");
      setSelectedSlot(null);
      await refreshDoctorSlots(selectedDoctor.id);
      return;
    }

    setBookingSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("patientId", selectedPatient.id);
      formData.append("doctorId", selectedDoctor.id);
      formData.append("startTime", selectedSlot.startTime);
      formData.append("endTime", selectedSlot.endTime);
      formData.append("patientDescription", patientDescription);

      const res = await bookAppointment(formData);
      if (res?.success) {
        toast.success(
          `Appointment booked for ${selectedPatient.name} with Dr. ${selectedDoctor.name}.`
        );
        if (!res.videoSessionReady && res.videoWarning) {
          toast.warning(`Video session unavailable: ${res.videoWarning}`);
        }
        setSelectedSlot(null);
        setPatientDescription("");
        setShowBooking(false);
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error?.message || "Unable to book appointment right now."
      );
      setSelectedSlot(null);
      await refreshDoctorSlots(selectedDoctor.id);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    if (checkingInId) return;
    setCheckingInId(appointmentId);
    try {
      const res = await checkInAppointment(appointmentId);
      if (res?.success) {
        setQueue((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? { ...apt, status: "IN_PROGRESS" }
              : apt
          )
        );
        toast.success("Patient checked in successfully.");
        router.refresh();
      }
    } catch (error) {
      toast.error(error?.message || "Failed to check in patient.");
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => setShowBooking((prev) => !prev)}
          className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 px-5 shadow-none flex items-center gap-2 cursor-pointer"
        >
          {showBooking ? (
            <>
              <X className="h-4 w-4" />
              Close Booking Form
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Book Appointment
            </>
          )}
        </Button>

        <Link href="/appointments" className="cursor-pointer">
          <Button
            variant="outline"
            className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold h-11 px-5 cursor-pointer"
          >
            View All Appointments
          </Button>
        </Link>
      </div>

      {/* Inline Front-Desk Appointment Booking Workflow */}
      {showBooking && (
        <Card className="bg-white text-black border border-slate-300 shadow-none rounded-lg py-0 gap-0">
          <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-black">
                  Book Appointment for Patient
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm mt-1">
                  Select or register a patient, choose a department & doctor, and confirm an available consultation slot.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBooking(false)}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-sm font-semibold h-9 px-3.5 cursor-pointer w-fit"
              >
                Cancel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Step 1: Patient Search & Walk-In Registration */}
            <div className="space-y-4 pb-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-black">
                    1. Select or Register Patient
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Search an existing patient or create a new walk-in patient profile.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegisterForm((prev) => !prev)}
                  className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-sm font-semibold h-10 px-4 cursor-pointer w-fit"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  {showRegisterForm ? "Back to Patient Search" : "Register New Patient"}
                </Button>
              </div>

              {showRegisterForm ? (
                <form
                  onSubmit={handleRegisterPatient}
                  className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-4"
                >
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    Walk-In Patient Registration
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="walkin-name" className="text-sm font-semibold text-black">
                        Full Name *
                      </Label>
                      <Input
                        id="walkin-name"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="bg-white border-slate-300 rounded-md text-sm h-11 text-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="walkin-email" className="text-sm font-semibold text-black">
                        Email
                      </Label>
                      <Input
                        id="walkin-email"
                        type="email"
                        placeholder="patient@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="bg-white border-slate-300 rounded-md text-sm h-11 text-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="walkin-phone" className="text-sm font-semibold text-black">
                        Phone
                      </Label>
                      <Input
                        id="walkin-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="bg-white border-slate-300 rounded-md text-sm h-11 text-black"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-black">
                        Gender
                      </Label>
                      <Select value={regGender} onValueChange={setRegGender}>
                        <SelectTrigger className="bg-white border-slate-300 rounded-md h-11 text-sm text-black cursor-pointer">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          <SelectItem value="MALE" className="cursor-pointer text-sm">Male</SelectItem>
                          <SelectItem value="FEMALE" className="cursor-pointer text-sm">Female</SelectItem>
                          <SelectItem value="OTHER" className="cursor-pointer text-sm">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegisterForm(false)}
                      className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-sm font-semibold h-10 px-4 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={registering}
                      className="rounded-md bg-black hover:bg-neutral-900 text-white text-sm font-semibold h-10 px-4 cursor-pointer shadow-none"
                    >
                      {registering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Save & Select Patient"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search patient by name, email, or phone..."
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      className="pl-10 bg-white border-slate-300 text-black rounded-md text-sm h-11"
                    />
                  </div>

                  {searchingPatients ? (
                    <p className="text-sm text-slate-500">Searching patients...</p>
                  ) : patientResults.length === 0 ? (
                    <div className="p-4 rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>No matching patients found.</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowRegisterForm(true)}
                        className="rounded-md bg-black hover:bg-neutral-900 text-white text-sm font-semibold h-9 px-3.5 cursor-pointer w-fit"
                      >
                        + Register New Patient
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                      {patientResults.map((patient) => {
                        const isSelected = selectedPatient?.id === patient.id;
                        return (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => setSelectedPatient(patient)}
                            className={`text-left p-4 rounded-md transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? "bg-slate-50 text-black border-2 border-black"
                                : "bg-white text-black border border-slate-200 hover:border-black"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-base font-bold text-black truncate">
                                {patient.name || "Patient"}
                              </p>
                              <p className="text-sm text-slate-600 truncate mt-0.5">
                                {patient.email}
                              </p>
                              {patient.phone && (
                                <p className="text-sm text-slate-500 truncate mt-0.5">
                                  {patient.phone}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedPatient && (
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-bold text-black uppercase tracking-wider mr-2 text-xs">
                      Selected Patient:
                    </span>
                    <span className="font-bold text-black">
                      {selectedPatient.name}
                    </span>
                    <span className="text-slate-600 ml-2">
                      ({selectedPatient.email}
                      {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ""})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-sm font-semibold text-slate-700 hover:text-black underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Department & Doctor Selection */}
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              <div className="space-y-4 pb-6 border-b border-slate-200">
                <h3 className="text-base font-bold text-black">
                  2. Select Department & Doctor
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-black">
                      Department / Specialty
                    </Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
                      <SelectTrigger className="bg-white border-slate-300 rounded-md h-11 text-sm text-black cursor-pointer">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="ALL" className="cursor-pointer text-sm">
                          All Departments
                        </SelectItem>
                        {departmentOptions.map((dept) => (
                          <SelectItem
                            key={dept}
                            value={dept}
                            className="cursor-pointer text-sm"
                          >
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-black">
                      Verified Doctor *
                    </Label>
                    <Select
                      value={selectedDoctorId}
                      onValueChange={setSelectedDoctorId}
                    >
                      <SelectTrigger className="bg-white border-slate-300 rounded-md h-11 text-sm text-black cursor-pointer">
                        <SelectValue
                          placeholder={
                            filteredDoctors.length === 0
                              ? "No verified doctors in this department"
                              : "Select a doctor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {filteredDoctors.map((doc) => (
                          <SelectItem
                            key={doc.id}
                            value={doc.id}
                            className="cursor-pointer text-sm"
                          >
                            Dr. {doc.name} ({doc.specialty || "General"} &bull; {doc.qualification || "MBBS"}) — ₹
                            {doc.consultationFee || 500}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 3: Available Dates & Slots */}
              <div className="space-y-4 pb-6 border-b border-slate-200">
                <h3 className="text-base font-bold text-black">
                  3. Select Available Date & Time Slot
                </h3>

                {!selectedDoctorId ? (
                  <p className="text-sm text-slate-600">
                    Choose a doctor above to view their available consultation dates and time slots.
                  </p>
                ) : loadingSlots ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available slots...
                  </div>
                ) : availableDays.length === 0 ? (
                  <div className="p-4 rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
                    No open slots available for Dr. {selectedDoctor?.name} in the upcoming window.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Available Dates
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {availableDays.map((day) => {
                          const isDaySelected = day.date === selectedDate;
                          const openCount = day.slots.filter(
                            (s) => !s.isBooked
                          ).length;
                          return (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => {
                                setSelectedDate(day.date);
                                setSelectedSlot(null);
                              }}
                              className={`px-3.5 py-2.5 rounded-md border text-sm font-semibold transition-colors cursor-pointer ${
                                isDaySelected
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-black border-slate-300 hover:border-black"
                              }`}
                            >
                              {format(
                                new Date(`${day.date}T00:00:00`),
                                "EEE, MMM d"
                              )}{" "}
                              ({openCount})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Time Slots (Grey = Already Booked)
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {currentDaySlots.map((slot) => {
                          const isBooked = Boolean(slot.isBooked);
                          const isSlotSelected =
                            !isBooked &&
                            selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={slot.startTime}
                              type="button"
                              disabled={isBooked}
                              title={isBooked ? "Already booked" : "Available"}
                              onClick={() => !isBooked && setSelectedSlot(slot)}
                              className={`px-3 py-2.5 rounded-md border text-sm font-semibold transition-colors ${
                                isBooked
                                  ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed line-through opacity-80"
                                  : isSlotSelected
                                  ? "bg-black text-white border-black cursor-pointer"
                                  : "bg-white text-black border-slate-300 hover:border-black cursor-pointer"
                              }`}
                            >
                              {slot.formatted}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Notes & Confirm */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="frontdesk-notes"
                    className="text-sm font-semibold text-black"
                  >
                    Visit Reason / Chief Complaint (Optional)
                  </Label>
                  <Textarea
                    id="frontdesk-notes"
                    rows={3}
                    placeholder="Optional symptoms or front-desk intake notes..."
                    value={patientDescription}
                    onChange={(e) => setPatientDescription(e.target.value)}
                    className="bg-white border-slate-300 text-black rounded-md text-sm sm:text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="text-sm text-slate-600">
                    {selectedPatient && selectedDoctor && selectedSlot ? (
                      <span>
                        Booking for{" "}
                        <strong className="text-black">
                          {selectedPatient.name}
                        </strong>{" "}
                        with{" "}
                        <strong className="text-black">
                          Dr. {selectedDoctor.name}
                        </strong>{" "}
                        &bull; {selectedSlot.day} ({selectedSlot.formatted}) &bull;{" "}
                        <strong className="text-black">
                          ₹{selectedDoctor.consultationFee || 500}
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Complete steps 1–3 to confirm the patient appointment.
                      </span>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      bookingSubmitting ||
                      !selectedPatient ||
                      !selectedDoctor ||
                      !selectedSlot
                    }
                    className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 px-6 text-sm sm:text-base cursor-pointer shadow-none shrink-0"
                  >
                    {bookingSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Booking Appointment...
                      </>
                    ) : (
                      "Confirm Appointment"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Today's Front-Desk Appointment Queue */}
      <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-black">
                Today&apos;s Patient Queue
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-1">
                Patient arrivals, doctor allocation, and billing payment status
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-black text-white border-black font-bold px-3.5 py-1.5 rounded-md text-xs sm:text-sm w-fit shrink-0"
            >
              {queue.length} Booked
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {queue.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-600 space-y-3">
              <p className="text-sm sm:text-base">No appointments booked for today yet.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBooking(true)}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold h-10 px-4 text-sm cursor-pointer"
              >
                Book First Appointment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs sm:text-sm uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Time</th>
                    <th className="px-6 py-3.5 font-semibold">Patient</th>
                    <th className="px-6 py-3.5 font-semibold">Doctor</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold">Billing</th>
                    <th className="px-6 py-3.5 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {queue.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {new Date(apt.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-black text-sm sm:text-base">
                          {apt.patient?.name || "Patient"}
                        </p>
                        {apt.patient?.email && (
                          <p className="text-xs sm:text-sm text-slate-500">
                            {apt.patient.email}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                        Dr. {apt.doctor?.name}{" "}
                        <span className="text-xs sm:text-sm text-slate-500 font-medium">
                          ({apt.doctor?.specialty})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            apt.status === "COMPLETED" ||
                            apt.status === "IN_PROGRESS"
                              ? "bg-black text-white border-black rounded-md text-xs sm:text-sm font-semibold"
                              : apt.status === "CANCELLED"
                              ? "bg-slate-200 text-slate-800 border-slate-300 rounded-md text-xs sm:text-sm font-semibold"
                              : "bg-slate-100 text-black border-slate-300 rounded-md text-xs sm:text-sm font-semibold"
                          }
                        >
                          {apt.status === "IN_PROGRESS"
                            ? "CHECKED IN"
                            : apt.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {apt.invoice ? (
                          <Badge
                            variant="outline"
                            className={
                              apt.invoice.status === "PAID"
                                ? "bg-black text-white border-black rounded-md text-xs sm:text-sm font-semibold"
                                : "bg-slate-100 text-black border-slate-300 rounded-md text-xs sm:text-sm font-semibold"
                            }
                          >
                            ₹{apt.invoice.totalAmount} &bull;{" "}
                            {apt.invoice.status}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {apt.status === "SCHEDULED" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={checkingInId === apt.id}
                            onClick={() => handleCheckIn(apt.id)}
                            className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs sm:text-sm font-semibold h-9 px-3.5 cursor-pointer shadow-none"
                          >
                            {checkingInId === apt.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <LogIn className="h-3.5 w-3.5 mr-1.5" />
                                Check In
                              </>
                            )}
                          </Button>
                        ) : apt.status === "IN_PROGRESS" ? (
                          <span className="text-sm font-semibold text-slate-700">
                            Arrived
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
