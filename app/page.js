import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Video,
  Lock,
  Receipt,
  CheckCircle2,
  Search,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FindDoctorSearch } from "@/components/find-doctor-search";
import { SPECIALTIES } from "@/lib/specialities";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let verifiedDoctorsCount = 20;
  try {
    const count = await db.user.count({
      where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
    });
    if (count > 0) verifiedDoctorsCount = count;
  } catch {
    // Fallback if database is temporarily unreachable during static build
  }

  const benefits = [
    {
      icon: <Video className="h-5 w-5 text-black" />,
      title: "In-Clinic & Video Consultations",
      desc: "Visit verified doctors in person at the hospital clinic or join secure browser-based HD video consultations from home.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-black" />,
      title: "Verified Specialists",
      desc: "Every doctor on CareSphere is credential-verified with transparent qualifications, experience, and fees.",
    },
    {
      icon: <Clock className="h-5 w-5 text-black" />,
      title: "Dynamic Slot Booking",
      desc: "View real-time 30-minute clinic and online consultation windows synced directly with each doctor's schedule.",
    },
    {
      icon: <FileText className="h-5 w-5 text-black" />,
      title: "Digital Prescriptions",
      desc: "Access clinical visit summaries, consultation notes, and prescriptions directly from your appointments portal.",
    },
    {
      icon: <Receipt className="h-5 w-5 text-black" />,
      title: "Front-Desk & Walk-In Billing",
      desc: "Seamless front-desk check-in, walk-in clinic registration, and transparent itemized invoices managed in one place.",
    },
    {
      icon: <Lock className="h-5 w-5 text-black" />,
      title: "Private & Role-Secured",
      desc: "Protected patient records and role-based workflows across Patients, Doctors, Front Desk, and Admins.",
    },
  ];

  return (
    <div className="bg-white text-black">
      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-black">
              <Stethoscope className="h-3.5 w-3.5 text-black" />
              In-Clinic Hospital Visits &amp; HD Video Consultations
            </span>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black leading-tight tracking-tight">
                Consult{" "}
                <span className="italic bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
                  Verified Doctors
                </span>
              </h1>
              <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
            </div>

            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl">
              Walk-In &amp; Scheduled Clinic Visits &bull; Live HD Video Calls &bull; Digital Prescriptions &amp; Billing
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/doctors" className="cursor-pointer">
                <Button
                  size="lg"
                  className="rounded-md bg-black hover:bg-neutral-900 text-white font-semibold px-7 h-11 text-sm sm:text-base shadow-none cursor-pointer"
                >
                  Book Appointment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/appointments" className="cursor-pointer">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold px-7 h-11 text-sm sm:text-base shadow-none cursor-pointer"
                >
                  My Appointments
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-xs sm:text-sm text-slate-700 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-black" />
                In-Clinic &amp; Video Visits
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-black" />
                {verifiedDoctorsCount}+ Verified Doctors
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-black" />
                Digital Prescriptions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK "FIND YOUR DOCTOR" SEARCH BAR ─── */}
      <section className="relative z-20 -mt-10 mb-14 container mx-auto px-4 lg:px-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 mb-6 gap-2">
            <h2 className="text-lg md:text-xl font-bold text-black flex items-center gap-2">
              <Search className="h-5 w-5 text-black" />
              Find Your Doctor
            </h2>
            <p className="text-xs md:text-sm text-slate-600 font-medium">
              Book an online video consultation or in-clinic visit in 3 quick steps
            </p>
          </div>

          <FindDoctorSearch specialties={SPECIALTIES.map((s) => s.name)} />
        </div>
      </section>

      {/* ─── BROWSE BY SPECIALTIES ─── */}
      <section className="py-10 container mx-auto px-4 lg:px-8">
        <div className="text-center mb-9">
          <h2 className="text-2xl sm:text-3xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Browse by Specialties
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
            Select a medical specialty to explore verified CareSphere doctors and live slots
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-y-8 gap-x-4 items-start justify-items-center">
          {SPECIALTIES.map((spec) => (
            <Link
              key={spec.name}
              href={`/doctors?spec=${encodeURIComponent(spec.name)}`}
              className="group flex flex-col items-center justify-start text-center w-full max-w-[110px] transition-all cursor-pointer"
            >
              <div className="w-20 h-20 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center transition-all group-hover:bg-white group-hover:border-black">
                {spec.icon}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-black text-center leading-tight mt-2.5 max-w-[105px]">
                {spec.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── STATS BANNER ─── */}
      <section className="container mx-auto px-4 lg:px-8 my-14">
        <div className="bg-black text-white rounded-lg py-10 px-6 border border-black">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            <div className="pt-4 md:pt-0">
              <h3 className="text-2xl sm:text-3xl font-extrabold italic bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block px-1">
                {verifiedDoctorsCount}+
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium">
                Verified Specialists
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <h3 className="text-2xl sm:text-3xl font-extrabold italic bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block px-1">
                {SPECIALTIES.length}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium">
                Medical Specialties
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <h3 className="text-2xl sm:text-3xl font-extrabold italic bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block px-1">
                Clinic &amp; Video
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium">
                In-Person &amp; Online Visits
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <h3 className="text-2xl sm:text-3xl font-extrabold italic bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block px-1">
                100% Digital
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 font-medium">
                Prescriptions &amp; Billing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES & ONLINE VIDEO CONSULTATION BENEFITS ─── */}
      <section id="features" className="py-10 container mx-auto px-4 lg:px-8 mb-8">
        <div id="benefits" className="text-center mb-9">
          <h2 className="text-2xl sm:text-3xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Why Choose CareSphere
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 max-w-lg mx-auto">
            Built for seamless in-clinic visits, online video consultations, and unified hospital care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 hover:border-black rounded-lg p-5 transition-colors flex items-start gap-4"
            >
              <div className="w-10 h-10 shrink-0 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
                {b.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-black leading-snug">
                  {b.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
