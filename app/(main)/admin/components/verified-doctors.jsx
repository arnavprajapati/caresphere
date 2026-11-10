"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Ban,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { updateDoctorActiveStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DoctorProfileOverview } from "@/components/doctor-profile-overview";

export function VerifiedDoctors({ initialDoctors = [], doctors: propDoctors }) {
  const [doctors, setDoctors] = useState(propDoctors || initialDoctors);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetDoctor, setTargetDoctor] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const {
    loading,
    fn: submitStatusUpdate,
    data,
  } = useFetch(updateDoctorActiveStatus);

  useEffect(() => {
    setDoctors(propDoctors || initialDoctors);
  }, [propDoctors, initialDoctors]);

  useEffect(() => {
    if (data?.success && pendingAction) {
      const { doctorId, suspend, doctorName } = pendingAction;
      const nextStatus = suspend ? "REJECTED" : "VERIFIED";
      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === doctorId
            ? {
                ...doc,
                verificationStatus: nextStatus,
              }
            : doc
        )
      );
      setViewDoctor((prev) =>
        prev && prev.id === doctorId
          ? { ...prev, verificationStatus: nextStatus }
          : prev
      );
      toast.success(
        `${suspend ? "Suspended" : "Reinstated"} Dr. ${doctorName} successfully!`
      );
      setTargetDoctor(null);
      setActionType(null);
      setPendingAction(null);
    }
  }, [data, pendingAction]);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialty || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (doctor, suspend) => {
    setTargetDoctor(doctor);
    setActionType(suspend ? "suspend" : "reinstate");
  };

  const confirmAction = async () => {
    if (!targetDoctor || !actionType) return;

    const suspend = actionType === "suspend";
    setPendingAction({
      doctorId: targetDoctor.id,
      suspend,
      doctorName: targetDoctor.name,
    });
    await submitStatusUpdate(targetDoctor.id, suspend);
  };

  return (
    <div>
      {viewDoctor ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-5 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDoctor(null)}
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Directory
              </Button>
              <div>
                <h2 className="text-base font-bold text-black">
                  Clinician Profile
                </h2>
                <p className="text-xs text-slate-600">
                  Doctor overview, clinical metrics, and configured consultation hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {viewDoctor.verificationStatus === "REJECTED" ? (
                <>
                  <Badge
                    variant="outline"
                    className="bg-slate-200 border-slate-300 text-slate-800 text-xs px-3 py-1 rounded-[6px] font-semibold"
                  >
                    Suspended
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(viewDoctor, false)}
                    disabled={loading}
                    className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold h-9 px-4 cursor-pointer shadow-none"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Reinstate
                  </Button>
                </>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className="bg-black border-black text-white text-xs px-3 py-1 rounded-[6px] font-semibold"
                  >
                    Active
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(viewDoctor, true)}
                    disabled={loading}
                    className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" />
                    Suspend
                  </Button>
                </>
              )}
            </div>
          </div>

          <DoctorProfileOverview doctor={viewDoctor} />
        </div>
      ) : (
        <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
          <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-black">
                  Hospital Clinicians Directory
                </CardTitle>
                <CardDescription className="text-slate-600 text-xs sm:text-sm">
                  Active certified doctors, departmental listing, and account status controls
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search doctors, specialties..."
                  className="pl-9 bg-white border-slate-300 text-black rounded-md text-sm h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 text-sm">
                {searchTerm
                  ? "No doctors match your search criteria."
                  : "No verified doctors currently registered."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => {
                  const isSuspended = doctor.verificationStatus === "REJECTED";
                  return (
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
                              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                                {doctor.specialty} • {doctor.qualification || "MBBS"} • {doctor.experience} yrs exp • ₹{doctor.consultationFee || 500}/visit
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {doctor.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewDoctor(doctor)}
                              className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View Profile
                            </Button>
                            {isSuspended ? (
                              <>
                                <Badge
                                  variant="outline"
                                  className="bg-slate-200 border-slate-300 text-slate-800 text-xs px-3 py-1 rounded-[6px] font-semibold"
                                >
                                  Suspended
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(doctor, false)}
                                  disabled={loading}
                                  className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold h-9 px-4 cursor-pointer shadow-none"
                                >
                                  {loading && targetDoctor?.id === doctor.id ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Reinstate
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant="outline"
                                  className="bg-black border-black text-white text-xs px-3 py-1 rounded-[6px] font-semibold"
                                >
                                  Active
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(doctor, true)}
                                  disabled={loading}
                                  className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
                                >
                                  <Ban className="h-3.5 w-3.5 mr-1" />
                                  Suspend
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!targetDoctor}
        onOpenChange={(open) => !open && setTargetDoctor(null)}
      >
        <AlertDialogContent className="bg-white border border-slate-200 text-black rounded-lg shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-black" />
              <AlertDialogTitle className="text-lg font-bold text-black">
                {actionType === "suspend"
                  ? "Suspend Doctor Access"
                  : "Reinstate Doctor Access"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 text-sm">
              {actionType === "suspend"
                ? `Are you sure you want to suspend Dr. ${targetDoctor?.name}? They will not be able to accept appointments or log in.`
                : `Are you sure you want to reinstate Dr. ${targetDoctor?.name}? Their profile and schedule will become active again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
            >
              {actionType === "suspend" ? "Suspend Doctor" : "Reinstate Doctor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
