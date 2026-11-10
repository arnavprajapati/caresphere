"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ShieldCheck, Calendar } from "lucide-react";

function formatAction(action) {
  switch (action) {
    case "DOCTOR_VERIFIED":
      return {
        label: "Clinician Approved",
        className: "bg-black text-white border-black",
      };
    case "DOCTOR_REJECTED":
      return {
        label: "Verification Rejected",
        className: "bg-slate-200 text-black border-slate-300",
      };
    case "DOCTOR_SUSPENDED":
      return {
        label: "Clinician Suspended",
        className: "bg-slate-200 text-black border-slate-300",
      };
    case "DOCTOR_REINSTATED":
      return {
        label: "Clinician Reinstated",
        className: "bg-black text-white border-black",
      };
    case "USER_ROLE_CHANGED":
      return {
        label: "Role Updated",
        className: "bg-slate-100 text-black border-slate-300",
      };
    case "APPOINTMENT_BOOKED":
    case "BOOK_APPOINTMENT":
      return {
        label: "Appointment Booked",
        className: "bg-slate-100 text-black border-slate-300",
      };
    case "VISIT_NOTE_CREATED":
      return {
        label: "Clinical Record Added",
        className: "bg-slate-100 text-black border-slate-300",
      };
    case "INVOICE_PAID":
      return {
        label: "Payment Reconciled",
        className: "bg-black text-white border-black",
      };
    default:
      return {
        label: action.replace(/_/g, " "),
        className: "bg-slate-100 text-black border-slate-300",
      };
  }
}

function formatDetails(details) {
  if (!details || details === "N/A" || details === "-") return "—";

  if (typeof details === "string" && (details.startsWith("{") || details.startsWith("["))) {
    try {
      const parsed = JSON.parse(details);
      if (parsed.doctorName && parsed.status) {
        return `Dr. ${parsed.doctorName} marked as ${parsed.status.toLowerCase()}`;
      }
      if (parsed.previousRole && parsed.newRole) {
        return `Role changed from ${parsed.previousRole} to ${parsed.newRole}`;
      }
      if (parsed.amount) {
        return `Invoice settled for ₹${parsed.amount}`;
      }
      return Object.entries(parsed)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
        .join(" • ");
    } catch {
      return details;
    }
  }

  return String(details);
}

function formatResource(resourceType) {
  const typeMap = {
    User: "Clinician Profile",
    Appointment: "Appointment Record",
    Invoice: "Billing Invoice",
    VisitRecord: "Clinical Chart",
  };
  return typeMap[resourceType] || resourceType || "Hospital System";
}

export function AuditLogs({ logs = [] }) {
  return (
    <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg py-0 gap-0">
      <CardHeader className="border-b border-slate-200 px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-black shrink-0" />
              System Audit Trail & Compliance Log
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm mt-1">
              Real-time monitoring of clinical verification, security actions, and role updates
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-black text-white border-black font-bold px-3.5 py-1.5 rounded-md text-xs w-fit shrink-0"
          >
            {logs.length} Logged Events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-6 py-3.5 font-semibold">Initiated By</th>
                  <th className="px-6 py-3.5 font-semibold">Action</th>
                  <th className="px-6 py-3.5 font-semibold">Target Resource</th>
                  <th className="px-6 py-3.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {logs.map((log) => {
                  const actionInfo = formatAction(log.action);
                  const readableDetails = formatDetails(log.details);
                  const readableResource = formatResource(log.resourceType);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-black text-xs sm:text-sm">
                          {log.user?.name || log.user?.email || "Administrator"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {log.user?.role || "ADMIN"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${actionInfo.className} font-semibold text-xs px-2.5 py-0.5 rounded-md`}
                        >
                          {actionInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap text-xs sm:text-sm">
                        {readableResource}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-medium max-w-sm text-xs sm:text-sm">
                        {readableDetails}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
