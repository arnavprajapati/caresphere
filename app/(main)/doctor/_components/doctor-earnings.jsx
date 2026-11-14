"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Coins,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  Loader2,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestPayout } from "@/actions/payout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export function DoctorEarnings({ earnings = {}, payouts = [] }) {
  const router = useRouter();
  const [payoutList, setPayoutList] = useState(payouts);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    totalEarnings = 0,
  } = earnings;

  const avgFee =
    completedAppointments > 0
      ? Math.round(totalEarnings / completedAppointments)
      : 500;

  const metrics = [
    {
      label: "Completed Visits",
      value: completedAppointments,
      sublabel: "Patient visits",
      icon: Calendar,
      reconciled: false,
    },
    {
      label: "Monthly Earnings",
      value: `₹${thisMonthEarnings.toLocaleString()}`,
      sublabel: "Reconciled",
      icon: TrendingUp,
      reconciled: true,
    },
    {
      label: "Total Revenue",
      value: `₹${totalEarnings.toLocaleString()}`,
      sublabel: "Consultation fees",
      icon: Coins,
      reconciled: false,
    },
    {
      label: "Avg / Consultation",
      value: `₹${avgFee}`,
      sublabel: "Standard rate",
      icon: BarChart3,
      reconciled: false,
    },
  ];

  const handleDisbursePayout = async () => {
    setIsDisbursing(true);
    try {
      const res = await requestPayout();
      if (res?.success) {
        toast.success(
          res.message || "Disbursement transfer initiated to your bank account!"
        );
        setShowPayoutModal(false);
        const newRecord = {
          id: `payout-${Date.now()}`,
          amount: res.amount || totalEarnings || 500,
          status: "SETTLED",
          createdAt: new Date().toISOString(),
          method: "Direct Bank Transfer",
        };
        setPayoutList((prev) => [newRecord, ...prev]);
        router.refresh();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to disburse payout.");
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Uniform Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="h-full min-h-[148px] bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0"
            >
              <CardContent className="p-6 h-full flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 leading-snug">
                    {metric.label}
                  </p>
                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 text-black flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                    {metric.value}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                    {metric.reconciled && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-black shrink-0" />
                    )}
                    <span>{metric.sublabel}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payout & Billing Statement */}
      <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
        <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-black shrink-0" />
            Clinical Earnings & Hospital Settlement
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            Automatic itemized reconciliation with patient invoices and front-desk settlements
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Settled Balance Available
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-black">
                ₹{totalEarnings.toLocaleString()}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Direct hospital bank transfer or instant payout disbursement
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-300 rounded-md px-3 py-1.5 text-xs font-bold shrink-0"
              >
                Reconciled &amp; Ready
              </Badge>
              <Button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                disabled={totalEarnings <= 0}
                className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs sm:text-sm font-semibold h-10 px-4 cursor-pointer shadow-none flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                Disburse Payout
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="h-4 w-4 text-slate-700" />
              Settlement &amp; Disbursement History
            </h4>
            {payoutList.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700">
                  No previous disbursements requested.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  When front-desk or patients pay consultation fees, earnings accumulate here and can be disbursed directly to your bank account anytime.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-xs sm:text-sm text-slate-700 font-medium">
                          {p.createdAt
                            ? format(new Date(p.createdAt), "MMM d, yyyy • h:mm a")
                            : "Recent"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">
                          {p.id.slice(0, 12)}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-slate-700">
                          {p.method || "Direct Bank Transfer"}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm font-bold text-black">
                          ₹{p.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] font-bold"
                          >
                            {p.status || "SETTLED"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="sm:max-w-md bg-white text-black p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-black flex items-center gap-2">
              <Building2 className="h-5 w-5 text-black" />
              Confirm Bank Disbursement
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Transfer your settled clinical consultation fees to your registered doctor bank account.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 my-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Available Balance:</span>
              <span className="font-extrabold text-black">₹{totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Disbursement Method:</span>
              <span className="font-semibold text-slate-900">Direct Hospital NEFT/IMPS</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm border-t border-slate-200 pt-2 font-bold">
              <span className="text-black">Net Transfer Amount:</span>
              <span className="text-emerald-700">₹{totalEarnings.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDisbursing}
              onClick={() => setShowPayoutModal(false)}
              className="border-slate-300 rounded-md text-xs sm:text-sm font-semibold h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDisbursing || totalEarnings <= 0}
              onClick={handleDisbursePayout}
              className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs sm:text-sm font-semibold h-10 px-5 shadow-none"
            >
              {isDisbursing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Bank Transfer...
                </>
              ) : (
                `Confirm & Disburse ₹${totalEarnings.toLocaleString()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
