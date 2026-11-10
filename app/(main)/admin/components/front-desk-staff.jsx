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
import { Check, X, Ban, ClipboardList } from "lucide-react";
import { updateFrontDeskStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

export function FrontDeskStaff({ initialStaff = [] }) {
  const router = useRouter();
  const [staffList, setStaffList] = useState(initialStaff);
  const [pendingAction, setPendingAction] = useState(null);

  const {
    loading,
    fn: submitStatusUpdate,
    data: updateResult,
  } = useFetch(updateFrontDeskStatus);

  useEffect(() => {
    setStaffList(initialStaff);
  }, [initialStaff]);

  useEffect(() => {
    if (updateResult?.success && pendingAction) {
      setStaffList((prev) =>
        prev.map((member) =>
          member.id === pendingAction.staffId
            ? { ...member, verificationStatus: pendingAction.status }
            : member
        )
      );
      const actionLabel =
        pendingAction.status === "VERIFIED"
          ? "approved"
          : pendingAction.status === "REJECTED"
          ? "declined"
          : "suspended";
      toast.success(`Front-desk staff ${actionLabel} successfully`);
      setPendingAction(null);
      router.refresh();
    }
  }, [updateResult, pendingAction, router]);

  const handleStatusChange = async (staffId, status) => {
    setPendingAction({ staffId, status });
    await submitStatusUpdate(staffId, status);
  };

  const pendingOrDeclined = staffList.filter(
    (s) => s.verificationStatus !== "VERIFIED"
  );
  const verifiedStaff = staffList.filter(
    (s) => s.verificationStatus === "VERIFIED"
  );

  return (
    <div className="space-y-6">
      {loading && <BarLoader width={"100%"} color="#000000" />}

      <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-black">
            Front-Desk Access Requests
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            Approve or decline staff requests before unlocking front-desk registration and billing tools
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {pendingOrDeclined.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 text-sm">
              No pending front-desk access requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrDeclined.map((member) => {
                const isRejected = member.verificationStatus === "REJECTED";
                return (
                  <Card
                    key={member.id}
                    className="bg-white border border-slate-200 hover:border-black rounded-md shadow-none transition-colors py-0 gap-0"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-md bg-slate-100 border border-slate-200 text-black flex items-center justify-center shrink-0">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-black text-base">
                              {member.name || "Staff Member"}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium">
                              {member.email}
                              {member.phone ? ` • ${member.phone}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
                          <Badge
                            variant="outline"
                            className={
                              isRejected
                                ? "bg-slate-200 border-slate-300 text-slate-800 text-xs px-3 py-1 rounded-[6px] font-semibold"
                                : "bg-slate-100 border-slate-300 text-black text-xs px-3 py-1 rounded-[6px] font-semibold"
                            }
                          >
                            {isRejected ? "Declined" : "Pending Review"}
                          </Badge>

                          {!isRejected && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => handleStatusChange(member.id, "REJECTED")}
                              className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Decline
                            </Button>
                          )}

                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => handleStatusChange(member.id, "VERIFIED")}
                            className="rounded-md bg-black hover:bg-neutral-900 text-white text-xs font-semibold h-9 px-4 cursor-pointer shadow-none"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Approve Access
                          </Button>
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

      <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-black">
            Verified Front-Desk Staff ({verifiedStaff.length})
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            Active front-desk staff authorized to manage walk-ins, appointments, and invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {verifiedStaff.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 text-sm">
              No verified front-desk staff yet.
            </div>
          ) : (
            <div className="space-y-3">
              {verifiedStaff.map((member) => (
                <Card
                  key={member.id}
                  className="bg-white border border-slate-200 rounded-md shadow-none py-0 gap-0"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-black text-sm sm:text-base">
                          {member.name || "Staff Member"}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {member.email}
                          {member.phone ? ` • ${member.phone}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <Badge
                          variant="outline"
                          className="bg-black border-black text-white text-xs px-3 py-1 rounded-[6px] font-semibold"
                        >
                          Verified
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                          onClick={() => handleStatusChange(member.id, "PENDING")}
                          className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 text-xs font-semibold h-9 px-3 cursor-pointer"
                        >
                          <Ban className="mr-1 h-3.5 w-3.5" />
                          Suspend
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
    </div>
  );
}
