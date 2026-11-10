"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DoctorEarnings({ earnings = {}, payouts = [] }) {
  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    totalEarnings = 0,
  } = earnings;

  const avgFee =
    completedAppointments > 0 ? Math.round(totalEarnings / completedAppointments) : 500;

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
        <CardContent className="p-6">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Settled Balance
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-black">
                ₹{totalEarnings.toLocaleString()}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Direct hospital bank transfer on 1st of every month
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-black text-white border-black rounded-md px-3.5 py-1.5 text-xs font-bold self-start sm:self-center shrink-0"
            >
              Auto-Settled
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
