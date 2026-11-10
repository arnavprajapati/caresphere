import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  User,
  Briefcase,
  Star,
  Award,
  Users,
  GraduationCap,
  IndianRupee,
  MapPin,
  Clock,
} from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime12h(time24) {
  if (!time24 || !time24.includes(":")) return "";
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function summarizeAvailability(weeklySchedule = [], legacySlots = []) {
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const active = (weeklySchedule || [])
    .filter((w) => w.isActive)
    .sort((a, b) => orderedDays.indexOf(a.dayOfWeek) - orderedDays.indexOf(b.dayOfWeek));

  if (active.length > 0) {
    if (active.length === 1) {
      const d = active[0];
      return `${DAY_NAMES[d.dayOfWeek]} • ${formatTime12h(d.startTime)} – ${formatTime12h(d.endTime)}`;
    }
    const allSameHours = active.every(
      (d) => d.startTime === active[0].startTime && d.endTime === active[0].endTime
    );
    if (allSameHours) {
      const dayList = active.map((d) => DAY_NAMES[d.dayOfWeek]).join(", ");
      return `${dayList} (${formatTime12h(active[0].startTime)} – ${formatTime12h(active[0].endTime)})`;
    }
    return active
      .map(
        (d) =>
          `${DAY_NAMES[d.dayOfWeek]} (${formatTime12h(d.startTime)} – ${formatTime12h(d.endTime)})`
      )
      .join(", ");
  }

  if (legacySlots && legacySlots.length > 0) {
    try {
      const start = format(new Date(legacySlots[0].startTime), "h:mm a");
      const end = format(new Date(legacySlots[0].endTime), "h:mm a");
      return `${start} – ${end}`;
    } catch {
      return "Configured";
    }
  }

  return "Not configured yet";
}

export function DoctorProfileOverview({
  doctor,
  patientsCount,
  weeklySchedule,
  legacySlots = [],
}) {
  if (!doctor) return null;

  const displayName = (doctor.name || "Doctor").replace(/^Dr\.\s*/i, "");
  const effectivePatientsCount =
    typeof patientsCount === "number"
      ? patientsCount
      : doctor._count?.doctorAppointments ?? 0;

  const effectiveWeekly = weeklySchedule ?? doctor.weeklyAvailabilities ?? [];
  const availabilityText = summarizeAvailability(effectiveWeekly, legacySlots);

  const infoItems = [
    {
      label: "Experience",
      value: `${doctor.experience || 0} years`,
      icon: Briefcase,
    },
    {
      label: "Rating",
      value: "5.0 ★",
      icon: Star,
    },
    {
      label: "Specialization",
      value: doctor.specialty || "General Medicine",
      icon: Award,
    },
    {
      label: "Patients",
      value: String(effectivePatientsCount),
      icon: Users,
    },
    {
      label: "Qualification",
      value: doctor.qualification || "MBBS",
      icon: GraduationCap,
    },
    {
      label: "Consultation Fee",
      value: `₹${doctor.consultationFee || 500}`,
      icon: IndianRupee,
    },
    {
      label: "Location",
      value: doctor.address || "Hospital Clinic",
      icon: MapPin,
    },
    {
      label: "Availability",
      value: availabilityText,
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Identity Card: Gradient banner on top, clean white lower section */}
      <Card className="lg:col-span-4 bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative bg-white px-6 pb-6 text-center">
          <div className="-mt-14 w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md mx-auto flex items-center justify-center relative z-10">
            {doctor.imageUrl ? (
              <img
                src={doctor.imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-black" />
            )}
          </div>

          <div
            className="absolute right-5 top-3 w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-white shadow-sm flex items-center justify-center"
            title={doctor.specialty || "Clinician"}
          >
            <Briefcase className="h-4 w-4" />
          </div>

          <h3 className="text-xl font-bold text-black tracking-tight mt-4">
            {displayName}
          </h3>
          <p className="text-sm text-slate-600 font-medium break-all mt-1">
            {doctor.email}
          </p>

          <div className="mt-5 w-full py-2.5 px-4 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span>
              Joined{" "}
              {doctor.createdAt
                ? format(new Date(doctor.createdAt), "MMM d, yyyy")
                : "Recently"}
            </span>
          </div>
        </div>
      </Card>

      {/* Right Professional Profile Card */}
      <Card className="lg:col-span-8 bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Professional Profile
          </p>
          <h2 className="text-xl font-bold text-black mt-1">
            Dr. {displayName}
          </h2>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/70 flex items-center gap-3.5 min-h-[76px]"
                >
                  <div className="w-10 h-10 rounded-md bg-white border border-slate-200 text-black flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-black break-words mt-0.5">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
