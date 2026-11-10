import Link from "next/link";
import { getFilteredDoctors } from "@/actions/doctors-listing";
import { DoctorCard } from "./components/doctor-card";
import {
  DoctorsFilterSidebar,
  ActiveFilterChips,
} from "./components/doctors-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default async function DoctorsPage({ searchParams }) {
  const params = await searchParams;
  const rawSpec = params?.spec;
  const currentSpecs = Array.isArray(rawSpec)
    ? rawSpec.filter(Boolean)
    : rawSpec
    ? rawSpec
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const currentExp = params?.exp || "";
  const currentFee = params?.fee || "";

  const { doctors = [] } = await getFilteredDoctors({
    specialty: currentSpecs,
    experience: currentExp,
    feeRange: currentFee,
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
          Consult Doctors Online
        </h1>
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
        <p className="text-sm text-slate-500 mt-2.5">
          Showing {doctors.length} verified healthcare specialists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── LEFT SIDEBAR: FILTERS ─── */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto clean-scrollbar">
          <DoctorsFilterSidebar
            currentSpecs={currentSpecs}
            currentExp={currentExp}
            currentFee={currentFee}
          />
        </aside>

        {/* ─── RIGHT CONTENT: DOCTOR LISTING ─── */}
        <main className="lg:col-span-9 space-y-5 lg:min-h-[max(680px,calc(100vh-5rem))]">
          {/* Active Filter Chips at Top */}
          <ActiveFilterChips
            currentSpecs={currentSpecs}
            currentExp={currentExp}
            currentFee={currentFee}
          />

          {/* 2-Column Doctors Grid or Empty State */}
          {doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <Card className="bg-white border border-slate-200 rounded-lg shadow-none py-0 p-12 text-center">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-black">
                  <Filter className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-black">No doctors found</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Try adjusting your filters or search keywords to see more verified healthcare specialists.
                </p>
                <div className="pt-2">
                  <Link href="/doctors">
                    <Button
                      variant="outline"
                      className="rounded-md bg-white border-slate-300 hover:bg-slate-100 text-black font-semibold px-6 cursor-pointer"
                    >
                      Clear all filters
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
