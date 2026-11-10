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
import {
  Check,
  User,
  DollarSign,
  Mail,
  Stethoscope,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approvePayout } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

export function PendingPayouts({ payouts = [] }) {
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { loading, data, fn: submitApproval } = useFetch(approvePayout);

  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
  };

  const handleApprovePayout = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedPayout || loading) return;

    const formData = new FormData();
    formData.append("payoutId", selectedPayout.id);

    await submitApproval(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowApproveDialog(false);
      setSelectedPayout(null);
      toast.success("Payout approved and settled successfully!");
    }
  }, [data]);

  const closeDialogs = () => {
    setSelectedPayout(null);
    setShowApproveDialog(false);
  };

  return (
    <div>
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            Pending Doctor Payouts
          </CardTitle>
          <CardDescription className="text-slate-500">
            Review and settle clinician consultation disbursement requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No pending payout requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="bg-slate-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 rounded-xl p-2.5 border border-blue-100">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            Dr. {payout.doctor?.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Requested: ₹{payout.netAmount || payout.amount} • {format(new Date(payout.createdAt), "PPP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 border-amber-200 text-amber-700 text-xs px-2.5 py-0.5 rounded-full"
                        >
                          Pending Settlement
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payout)}
                          className="rounded-xl border-slate-200 text-slate-700 hover:bg-white text-xs font-semibold"
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayout(payout)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          Settle
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

      {/* Details Dialog */}
      {selectedPayout && !showApproveDialog && (
        <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
          <DialogContent className="max-w-xl bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Payout Disbursement Details
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Doctor consultation earnings disbursement breakdown
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="text-slate-900 font-bold">Dr. {selectedPayout.doctor?.name}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="text-slate-700">{selectedPayout.paypalEmail || "Bank Account Transfer"}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-2">
                  <span className="text-slate-900">Total Net Amount:</span>
                  <span className="text-blue-600 text-sm">₹{selectedPayout.netAmount || selectedPayout.amount}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between gap-2">
              <Button
                variant="outline"
                onClick={closeDialogs}
                className="rounded-xl border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                onClick={() => handleApprovePayout(selectedPayout)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Approve & Settle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Confirmation Dialog */}
      {showApproveDialog && selectedPayout && (
        <Dialog
          open={showApproveDialog}
          onOpenChange={() => setShowApproveDialog(false)}
        >
          <DialogContent className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Confirm Payout Settlement
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Are you sure you want to approve and settle this disbursement?
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 my-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Doctor:</span>
                <span className="text-slate-900 font-bold">Dr. {selectedPayout.doctor?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Settlement Amount:</span>
                <span className="text-blue-600 font-bold">₹{selectedPayout.netAmount || selectedPayout.amount}</span>
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#2563eb" />}

            <DialogFooter className="flex sm:justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={loading}
                className="rounded-xl border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={loading}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Confirm Settlement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
