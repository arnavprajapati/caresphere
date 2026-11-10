"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, User, FileText, ArrowLeft } from "lucide-react";
import { updateDoctorStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import { DoctorProfileOverview } from "@/components/doctor-profile-overview";

export function PendingDoctors({ initialDoctors = [], doctors: propDoctors }) {
  const router = useRouter();
  const [doctors, setDoctors] = useState(propDoctors || initialDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const {
    loading,
    fn: submitStatusUpdate,
    data: updateResult,
  } = useFetch(updateDoctorStatus);

  useEffect(() => {
    setDoctors(propDoctors || initialDoctors);
  }, [propDoctors, initialDoctors]);

  useEffect(() => {
    if (updateResult?.success && pendingAction) {
      setDoctors((prev) => prev.filter((doc) => doc.id !== pendingAction.doctorId));
      setSelectedDoctor(null);
      toast.success(
        `Doctor ${pendingAction.status === "VERIFIED" ? "approved" : "rejected"} successfully`
      );
      setPendingAction(null);
      router.refresh();
    }
  }, [updateResult, pendingAction, router]);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseDialog = () => {
    setSelectedDoctor(null);
  };

  const handleUpdateStatus = async (doctorId, status) => {
    setPendingAction({ doctorId, status });
    await submitStatusUpdate(doctorId, status);
  };

  return (
    <div>
      {selectedDoctor ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-5 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseDialog}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Pending Requests
              </Button>
              <div>
                <h2 className="text-base font-bold text-black">
                  Doctor Verification Details
                </h2>
                <p className="text-xs text-slate-600">
                  Review clinician profile and credentials before approving hospital access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleUpdateStatus(selectedDoctor.id, "REJECTED")
                }
                disabled={loading}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleUpdateStatus(selectedDoctor.id, "VERIFIED")
                }
                disabled={loading}
                className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold h-9 px-4 cursor-pointer shadow-none"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Approve Clinician
              </Button>
            </div>
          </div>

          {loading && <BarLoader width={"100%"} color="#000000" />}

          <DoctorProfileOverview doctor={selectedDoctor} />

          {/* Credentials & Bio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Verification Document
              </h4>
              {selectedDoctor.credentialUrl ? (
                <a
                  href={selectedDoctor.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:underline font-semibold text-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  View Verification Document
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-xs text-slate-500">No document link provided</p>
              )}
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-black" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Clinical Bio / Service Description
                </h4>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                {selectedDoctor.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
          <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
            <CardTitle className="text-base sm:text-lg font-bold text-black">
              Pending Doctor Verifications
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm">
              Review and approve clinician credentials for hospital onboarding
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {doctors.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 text-sm">
                No pending verification requests at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="bg-white border border-slate-200 hover:border-black rounded-md shadow-none transition-colors py-0 gap-0"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-md bg-slate-100 border border-slate-200 text-black flex items-center justify-center shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-black text-base">
                              Dr. {doctor.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium">
                              {doctor.specialty} • {doctor.qualification || "MBBS"} • {doctor.experience} years experience
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 self-end md:self-auto">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 border-slate-300 text-black text-xs px-3 py-1 rounded-md font-semibold"
                          >
                            Pending Review
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(doctor)}
                            className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold px-4 h-9 cursor-pointer shadow-none"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
