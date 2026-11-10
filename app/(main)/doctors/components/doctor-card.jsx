import { User, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DoctorCard({ doctor }) {
  const fee = doctor.consultationFee || 500;
  const displayName = (doctor.name || "Doctor").replace(/^Dr\.\s*/i, "");
  const specialty = doctor.specialty || "General Medicine";
  const experience = doctor.experience || 5;
  const qualification = doctor.qualification || "MBBS";
  const location = doctor.address || "Hospital Clinic";

  return (
    <Card className="bg-white text-black border border-slate-200 hover:border-slate-400 rounded-lg overflow-hidden shadow-none transition-all py-0 gap-0 flex flex-col justify-between">
      <div>
        <div className="h-28 bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#0f296b]" />

        <div className="px-6">
          <div className="-mt-12 w-24 h-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-sm flex items-center justify-center">
            {doctor.imageUrl ? (
              <img
                src={doctor.imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-slate-700" />
            )}
          </div>
        </div>

        <div className="px-6 pt-3 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug">
                Dr. {displayName}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {specialty}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>98%</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Verified</p>
            </div>
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Experience:</span>{" "}
              {experience} years
            </p>
            <p>
              <span className="font-semibold text-slate-800">Qualification:</span>{" "}
              {qualification}
            </p>
            <p className="truncate">
              <span className="font-semibold text-slate-800">Location:</span>{" "}
              {location}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 bg-white">
        <span className="text-lg font-extrabold text-slate-900">₹{fee}</span>

        <Link
          href={`/doctors/${encodeURIComponent(specialty)}/${doctor.id}`}
          className="cursor-pointer"
        >
          <Button className="bg-slate-900 hover:bg-black text-white font-semibold rounded-md px-5 h-10 text-sm shadow-none cursor-pointer transition-colors">
            Digital Consult
          </Button>
        </Link>
      </div>
    </Card>
  );
}
