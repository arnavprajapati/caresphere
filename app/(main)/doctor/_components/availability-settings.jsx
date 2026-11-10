"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Loader2,
  AlertCircle,
  IndianRupee,
  Calendar as CalendarIcon,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import {
  saveWeeklyAvailability,
  setDateAvailabilityOverride,
  deleteDateAvailabilityOverride,
  updateDoctorConsultationFee,
} from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

const WEEKDAYS = [
  { dayOfWeek: 1, label: "Monday", short: "Mon" },
  { dayOfWeek: 2, label: "Tuesday", short: "Tue" },
  { dayOfWeek: 3, label: "Wednesday", short: "Wed" },
  { dayOfWeek: 4, label: "Thursday", short: "Thu" },
  { dayOfWeek: 5, label: "Friday", short: "Fri" },
  { dayOfWeek: 6, label: "Saturday", short: "Sat" },
  { dayOfWeek: 0, label: "Sunday", short: "Sun" },
];

function formatTime12h(time24) {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function buildInitialWeeklyState(initialWeeklySchedule = [], legacySlots = []) {
  const map = new Map(
    (initialWeeklySchedule || []).map((item) => [item.dayOfWeek, item])
  );

  const hasAnySavedWeekly = (initialWeeklySchedule || []).length > 0;
  let legacyStart = "09:00";
  let legacyEnd = "17:00";
  if (!hasAnySavedWeekly && legacySlots && legacySlots.length > 0) {
    try {
      legacyStart = format(new Date(legacySlots[0].startTime), "HH:mm");
      legacyEnd = format(new Date(legacySlots[0].endTime), "HH:mm");
    } catch {
      // Keep default 09:00-17:00
    }
  }

  return WEEKDAYS.map((wd) => {
    const saved = map.get(wd.dayOfWeek);
    if (saved) {
      return {
        dayOfWeek: wd.dayOfWeek,
        label: wd.label,
        short: wd.short,
        isActive: Boolean(saved.isActive),
        startTime: saved.startTime || "09:00",
        endTime: saved.endTime || "17:00",
      };
    }
    return {
      dayOfWeek: wd.dayOfWeek,
      label: wd.label,
      short: wd.short,
      isActive: false,
      startTime: legacyStart,
      endTime: legacyEnd,
    };
  });
}

export function AvailabilitySettings({
  slots = [],
  initialWeeklySchedule = [],
  initialOverrides = [],
  availabilityError = null,
  initialFee = 500,
}) {
  const router = useRouter();
  const [fee, setFee] = useState(initialFee);

  const [weeklySchedule, setWeeklySchedule] = useState(() =>
    buildInitialWeeklyState(initialWeeklySchedule, slots)
  );

  const [overrides, setOverrides] = useState(initialOverrides || []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [overrideMode, setOverrideMode] = useState("block");
  const [dateStartTime, setDateStartTime] = useState("09:00");
  const [dateEndTime, setDateEndTime] = useState("17:00");
  const [dateReason, setDateReason] = useState("");
  const [showAvailabilityCard, setShowAvailabilityCard] = useState(true);
  const [showWeeklyDropdown, setShowWeeklyDropdown] = useState(false);
  const [showDatesDropdown, setShowDatesDropdown] = useState(false);

  const {
    loading: feeLoading,
    fn: submitFee,
    data: feeData,
  } = useFetch(updateDoctorConsultationFee);

  const {
    loading: weeklyLoading,
    fn: submitWeekly,
    data: weeklyData,
  } = useFetch(saveWeeklyAvailability);

  const {
    loading: overrideLoading,
    fn: submitOverride,
    data: overrideData,
  } = useFetch(setDateAvailabilityOverride);

  const {
    loading: deleteLoading,
    fn: submitDeleteOverride,
    data: deleteData,
  } = useFetch(deleteDateAvailabilityOverride);

  useEffect(() => {
    setWeeklySchedule(buildInitialWeeklyState(initialWeeklySchedule, slots));
  }, [initialWeeklySchedule, slots]);

  useEffect(() => {
    setOverrides(initialOverrides || []);
  }, [initialOverrides]);

  useEffect(() => {
    if (feeData?.success) {
      toast.success("Consultation fee updated successfully!");
      router.refresh();
    }
  }, [feeData, router]);

  useEffect(() => {
    if (weeklyData?.success) {
      toast.success("Recurring weekly schedule saved!");
      router.refresh();
    }
  }, [weeklyData, router]);

  useEffect(() => {
    if (overrideData?.success && overrideData.override) {
      const saved = overrideData.override;
      setOverrides((prev) => {
        const filtered = prev.filter((o) => o.date !== saved.date);
        return [...filtered, saved].sort((a, b) => a.date.localeCompare(b.date));
      });
      toast.success(
        saved.isBlocked
          ? `Marked ${saved.date} as unavailable`
          : `Saved custom hours for ${saved.date}`
      );
      router.refresh();
    }
  }, [overrideData, router]);

  useEffect(() => {
    if (deleteData?.success) {
      toast.success("Date reverted to weekly schedule");
      router.refresh();
    }
  }, [deleteData, router]);

  const overrideByDate = useMemo(
    () => new Map(overrides.map((o) => [o.date, o])),
    [overrides]
  );

  const weeklyByDay = useMemo(
    () => new Map(weeklySchedule.map((w) => [w.dayOfWeek, w])),
    [weeklySchedule]
  );

  const handleSelectCalendarDate = (dateStr) => {
    setSelectedDate(dateStr);
    const existing = overrideByDate.get(dateStr);
    if (existing) {
      setOverrideMode(existing.isBlocked ? "block" : "custom");
      setDateStartTime(existing.startTime || "09:00");
      setDateEndTime(existing.endTime || "17:00");
      setDateReason(existing.reason || "");
    } else {
      const d = new Date(`${dateStr}T00:00:00`);
      const wk = weeklyByDay.get(getDay(d));
      setOverrideMode("block");
      setDateStartTime(wk?.startTime || "09:00");
      setDateEndTime(wk?.endTime || "17:00");
      setDateReason("");
    }
  };

  const handleUpdateFee = async (e) => {
    e.preventDefault();
    if (!fee || fee <= 0) {
      toast.error("Please enter a valid consultation fee");
      return;
    }
    await submitFee(fee);
  };

  const handleToggleWeekday = (dayOfWeek) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek
          ? { ...item, isActive: !item.isActive }
          : item
      )
    );
  };

  const handleWeekdayTimeChange = (dayOfWeek, field, value) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveWeekly = async (e) => {
    e.preventDefault();
    for (const item of weeklySchedule) {
      if (item.isActive && item.startTime >= item.endTime) {
        toast.error(`${item.label}: End time must be after start time`);
        return;
      }
    }
    await submitWeekly(
      weeklySchedule.map(({ dayOfWeek, isActive, startTime, endTime }) => ({
        dayOfWeek,
        isActive,
        startTime,
        endTime,
      }))
    );
  };

  const handleSaveDateOverride = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Please select a calendar date");
      return;
    }
    if (overrideMode === "custom" && dateStartTime >= dateEndTime) {
      toast.error("End time must be after start time");
      return;
    }
    await submitOverride({
      date: selectedDate,
      isBlocked: overrideMode === "block",
      startTime: overrideMode === "custom" ? dateStartTime : null,
      endTime: overrideMode === "custom" ? dateEndTime : null,
      reason: dateReason,
    });
  };

  const handleRemoveOverride = async (override) => {
    setOverrides((prev) => prev.filter((o) => o.id !== override.id));
    await submitDeleteOverride(override.id);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;
  const todayStart = startOfDay(new Date());

  const activeWeeklyDays = weeklySchedule.filter((w) => w.isActive);
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);
  const selectedWeeklyRule = weeklyByDay.get(getDay(selectedDateObj));
  const selectedExistingOverride = overrideByDate.get(selectedDate);

  return (
    <div className="space-y-6">
      {/* Consultation Pricing Card */}
      <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-black shrink-0" />
            Consultation Fee & Pricing
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            Set your per-consultation fee. This fee is charged to patients and appears on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUpdateFee} className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
            <div className="space-y-1.5 w-full">
              <Label htmlFor="fee" className="text-xs sm:text-sm font-bold text-slate-900">
                Consultation Fee (₹ INR)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-600 font-bold text-sm">
                  ₹
                </span>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  step="50"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="pl-8 bg-white border-slate-300 rounded-md text-black font-bold text-base h-11"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={feeLoading}
              className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 px-6 shrink-0 shadow-none transition-colors"
            >
              {feeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Price"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Availability & Working Slots Card */}
      <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
        <CardHeader
          onClick={() => setShowAvailabilityCard((prev) => !prev)}
          className={`px-6 pt-6 pb-4 cursor-pointer select-none hover:bg-slate-50/70 transition-colors ${
            showAvailabilityCard ? "border-b border-slate-200" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-black shrink-0" />
                Availability & Working Slots
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm">
                Configure recurring weekly hours and manage specific calendar dates or blocked days off. Patients and Front-Desk book strictly within these open windows.
              </CardDescription>
            </div>
            <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center text-black shrink-0">
              {showAvailabilityCard ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>

        {showAvailabilityCard && (
        <CardContent className="p-6 space-y-5">
          {availabilityError && (
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-md flex items-center gap-3 text-slate-900 text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4 text-black shrink-0" />
              <span>{availabilityError}</span>
            </div>
          )}

          {/* Active Schedule Summary */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                Active Weekly Summary
              </h3>
              {activeWeeklyDays.length === 0 && overrides.filter((o) => !o.isBlocked).length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-sm">
                  You have not enabled any working days yet. Open Recurring Weekly Availability or Specific Calendar Dates below.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeWeeklyDays.map((day) => (
                    <Badge
                      key={day.dayOfWeek}
                      variant="outline"
                      className="bg-slate-50 border-slate-300 text-black px-3 py-1.5 rounded-md text-xs font-semibold"
                    >
                      {day.short}: {formatTime12h(day.startTime)} – {formatTime12h(day.endTime)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {overrides.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date Overrides:
                </span>
                {overrides.map((ov) => (
                  <Badge
                    key={ov.id}
                    variant="outline"
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 ${
                      ov.isBlocked
                        ? "bg-slate-200 border-slate-300 text-slate-800"
                        : "bg-black border-black text-white"
                    }`}
                  >
                    <span>
                      {format(new Date(`${ov.date}T00:00:00`), "MMM d")}:{" "}
                      {ov.isBlocked
                        ? "Unavailable"
                        : `${formatTime12h(ov.startTime)} – ${formatTime12h(ov.endTime)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(ov)}
                      disabled={deleteLoading}
                      aria-label={`Reset ${ov.date} to weekly default`}
                      title="Reset to weekly default"
                      className="ml-0.5 opacity-80 hover:opacity-100 cursor-pointer"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Section 1 Dropdown: Recurring Weekly Schedule */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowWeeklyDropdown((prev) => !prev)}
              aria-expanded={showWeeklyDropdown}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold text-black flex items-center gap-2">
                  <Clock className="h-4 w-4 text-black shrink-0" />
                  Recurring Weekly Availability
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Set custom start and end times for each day of the week (e.g., Monday 9 AM–5 PM, Tuesday 10 AM–2 PM).
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-black border-slate-300 rounded-md text-xs font-semibold"
                >
                  {activeWeeklyDays.length} {activeWeeklyDays.length === 1 ? "Day" : "Days"} Open
                </Badge>
                {showWeeklyDropdown ? (
                  <ChevronUp className="h-4 w-4 text-black" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-black" />
                )}
              </div>
            </button>

            {showWeeklyDropdown && (
              <form onSubmit={handleSaveWeekly} className="p-5 pt-4 border-t border-slate-200 space-y-4">
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
              {weeklySchedule.map((item) => (
                <div
                  key={item.dayOfWeek}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 transition-colors ${
                    item.isActive ? "bg-white" : "bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[175px]">
                    <button
                      type="button"
                      onClick={() => handleToggleWeekday(item.dayOfWeek)}
                      aria-pressed={item.isActive}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                        item.isActive
                          ? "bg-black border-black text-white"
                          : "bg-white border-slate-300 hover:border-black"
                      }`}
                    >
                      {item.isActive && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleWeekday(item.dayOfWeek)}
                      className="text-left cursor-pointer"
                    >
                      <span
                        className={`text-sm font-bold ${
                          item.isActive ? "text-black" : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                    <Badge
                      variant="outline"
                      className={
                        item.isActive
                          ? "bg-black text-white border-black rounded-md text-[11px]"
                          : "bg-slate-100 text-slate-600 border-slate-300 rounded-md text-[11px]"
                      }
                    >
                      {item.isActive ? "Open" : "Off"}
                    </Badge>
                  </div>

                  {item.isActive ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Input
                        type="time"
                        value={item.startTime}
                        onChange={(e) =>
                          handleWeekdayTimeChange(item.dayOfWeek, "startTime", e.target.value)
                        }
                        aria-label={`${item.label} start time`}
                        className="bg-white border-slate-300 rounded-md text-black text-xs sm:text-sm h-9 w-[135px]"
                      />
                      <span className="text-xs font-medium text-slate-500">to</span>
                      <Input
                        type="time"
                        value={item.endTime}
                        onChange={(e) =>
                          handleWeekdayTimeChange(item.dayOfWeek, "endTime", e.target.value)
                        }
                        aria-label={`${item.label} end time`}
                        className="bg-white border-slate-300 rounded-md text-black text-xs sm:text-sm h-9 w-[135px]"
                      />
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-slate-400 italic">
                      Not scheduled for consultations
                    </span>
                  )}
                </div>
              ))}
            </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={weeklyLoading}
                    className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 px-6 shadow-none text-xs sm:text-sm transition-colors"
                  >
                    {weeklyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Weekly Schedule...
                      </>
                    ) : (
                      "Save Weekly Schedule"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Section 2 Dropdown: Specific Calendar Days & Unavailable Dates */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowDatesDropdown((prev) => !prev)}
              aria-expanded={showDatesDropdown}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold text-black flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-black shrink-0" />
                  Specific Calendar Dates & Unavailable Days
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Select any calendar date to assign custom consulting hours or mark an individual date as unavailable (overrides weekly hours).
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-black border-slate-300 rounded-md text-xs font-semibold"
                >
                  {overrides.length} {overrides.length === 1 ? "Date Set" : "Dates Set"}
                </Badge>
                {showDatesDropdown ? (
                  <ChevronUp className="h-4 w-4 text-black" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-black" />
                )}
              </div>
            </button>

            {showDatesDropdown && (
              <div className="p-5 pt-4 border-t border-slate-200 space-y-4">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive Monthly Calendar */}
              <div className="lg:col-span-7 border border-slate-200 rounded-lg p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm sm:text-base font-bold text-black">
                    {format(currentMonth, "MMMM yyyy")}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                      className="h-8 w-8 p-0 rounded-md bg-white text-black border-slate-300 hover:bg-slate-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                      className="h-8 w-8 p-0 rounded-md bg-white text-black border-slate-300 hover:bg-slate-100"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-[11px] font-bold text-slate-500 uppercase py-1">
                      {d}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: startPadding }).map((_, idx) => (
                    <div key={`pad-${idx}`} className="h-10" />
                  ))}
                  {daysInMonth.map((dayObj) => {
                    const dateStr = format(dayObj, "yyyy-MM-dd");
                    const isPast = isBefore(dayObj, todayStart);
                    const isSelected = selectedDate === dateStr;
                    const override = overrideByDate.get(dateStr);
                    const weeklyRule = weeklyByDay.get(getDay(dayObj));
                    const isBlocked = Boolean(override?.isBlocked);
                    const isCustom = Boolean(override && !override.isBlocked);
                    const isWeeklyOpen = Boolean(!override && weeklyRule?.isActive);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleSelectCalendarDate(dateStr)}
                        className={`relative h-10 rounded-md text-xs sm:text-sm font-semibold flex flex-col items-center justify-center transition-all border ${
                          isPast
                            ? "text-slate-300 border-transparent cursor-not-allowed bg-white"
                            : isSelected
                            ? "bg-black text-white border-black cursor-pointer"
                            : isBlocked
                            ? "bg-slate-200 text-slate-500 border-slate-300 line-through hover:bg-slate-300/70 cursor-pointer"
                            : isCustom
                            ? "bg-slate-100 text-black border-black hover:bg-slate-200 cursor-pointer"
                            : isWeeklyOpen
                            ? "bg-slate-50 text-black border-slate-300 hover:border-black cursor-pointer"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 cursor-pointer"
                        }`}
                      >
                        <span>{format(dayObj, "d")}</span>
                        {!isPast && !isSelected && (isWeeklyOpen || isCustom || isBlocked) && (
                          <span
                            className={`w-1 h-1 rounded-full mt-0.5 ${
                              isBlocked
                                ? "bg-slate-400"
                                : isCustom
                                ? "bg-black"
                                : "bg-slate-600"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    Weekly Hours
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                    Custom Hours
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    Unavailable / Blocked
                  </span>
                </div>
              </div>

              {/* Selected Date Editor Panel */}
              <form
                onSubmit={handleSaveDateOverride}
                className="lg:col-span-5 border border-slate-200 bg-slate-50 rounded-lg p-5 space-y-4"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Selected Date
                  </span>
                  <h4 className="text-base font-bold text-black mt-0.5">
                    {format(selectedDateObj, "EEEE, MMM d, yyyy")}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {selectedWeeklyRule?.isActive
                      ? `Weekly default: ${formatTime12h(selectedWeeklyRule.startTime)} – ${formatTime12h(selectedWeeklyRule.endTime)}`
                      : "Weekly default: Day Off"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideMode("block")}
                    className={`py-2.5 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      overrideMode === "block"
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <CalendarOff className="h-3.5 w-3.5" />
                    Mark Unavailable
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideMode("custom")}
                    className={`py-2.5 px-3 rounded-md border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      overrideMode === "custom"
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Custom Hours
                  </button>
                </div>

                {overrideMode === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="dateStartTime" className="text-xs font-bold text-slate-900">
                        Start Time
                      </Label>
                      <Input
                        id="dateStartTime"
                        type="time"
                        value={dateStartTime}
                        onChange={(e) => setDateStartTime(e.target.value)}
                        className="bg-white border-slate-300 rounded-md text-black text-xs sm:text-sm h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dateEndTime" className="text-xs font-bold text-slate-900">
                        End Time
                      </Label>
                      <Input
                        id="dateEndTime"
                        type="time"
                        value={dateEndTime}
                        onChange={(e) => setDateEndTime(e.target.value)}
                        className="bg-white border-slate-300 rounded-md text-black text-xs sm:text-sm h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="dateReason" className="text-xs font-bold text-slate-900">
                    Note / Reason (Optional)
                  </Label>
                  <Input
                    id="dateReason"
                    type="text"
                    value={dateReason}
                    onChange={(e) => setDateReason(e.target.value)}
                    placeholder={
                      overrideMode === "block"
                        ? "e.g. Personal leave, Conference"
                        : "e.g. Extended clinic hours"
                    }
                    className="bg-white border-slate-300 rounded-md text-black text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={overrideLoading}
                    className="w-full bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition-colors"
                  >
                    {overrideLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : overrideMode === "block" ? (
                      "Mark Date Unavailable"
                    ) : (
                      "Save Custom Hours for Date"
                    )}
                  </Button>

                  {selectedExistingOverride && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deleteLoading}
                      onClick={() => handleRemoveOverride(selectedExistingOverride)}
                      className="w-full rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs h-10"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Reset to Weekly Default
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {overrides.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Upcoming Date Exceptions ({overrides.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {overrides.map((ov) => (
                    <div
                      key={ov.id}
                      className="flex items-center justify-between p-3.5 rounded-md border border-slate-200 bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-black">
                            {format(new Date(`${ov.date}T00:00:00`), "EEE, MMM d, yyyy")}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              ov.isBlocked
                                ? "bg-slate-200 text-slate-800 border-slate-300 rounded-md text-[11px]"
                                : "bg-black text-white border-black rounded-md text-[11px]"
                            }
                          >
                            {ov.isBlocked
                              ? "Unavailable"
                              : `${formatTime12h(ov.startTime)} – ${formatTime12h(ov.endTime)}`}
                          </Badge>
                        </div>
                        {ov.reason && (
                          <p className="text-xs text-slate-600">{ov.reason}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deleteLoading}
                        onClick={() => handleRemoveOverride(ov)}
                        className="text-slate-500 hover:text-black h-8 w-8 p-0"
                        title="Remove date setting"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-black shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong>How Slots Work:</strong> Your recurring weekday hours automatically generate 30-minute consultation slots across upcoming dates. Custom date hours override that day&apos;s weekly window, and blocked dates are hidden from Patients and Front-Desk booking. Existing booked appointments are always preserved.
            </p>
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
}
