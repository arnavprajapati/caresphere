import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardCheck, AlertCircle, XCircle } from "lucide-react";

export default async function VerificationPage() {
  const user = await getCurrentUser();

  if (user?.role !== "DOCTOR") {
    redirect("/");
  }

  if (user?.verificationStatus === "VERIFIED") {
    redirect("/doctor");
  }

  const isRejected = user?.verificationStatus === "REJECTED";

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-xl mx-auto">
        <Card className="bg-white border border-slate-200/90 rounded-3xl shadow-sm text-center p-4">
          <CardHeader className="text-center pb-2">
            <div
              className={`mx-auto p-4 ${
                isRejected ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
              } rounded-2xl mb-3 w-fit`}
            >
              {isRejected ? (
                <XCircle className="h-8 w-8" />
              ) : (
                <ClipboardCheck className="h-8 w-8" />
              )}
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {isRejected
                ? "Clinician Verification Declined"
                : "Verification Under Review"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {isRejected
                ? "Your clinician profile requires credential corrections"
                : "Your hospital staff profile is queued for hospital administration review"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {isRejected ? (
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-left text-xs text-rose-800 space-y-2">
                <p className="font-semibold">
                  The medical board requested updates before approving access:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verify medical council registration certificate</li>
                  <li>Provide verifiable departmental specialization details</li>
                </ul>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Pending Administrator Clearance</span>
                </div>
                <p>
                  Hospital administrators verify doctor credentials before public patient booking is activated. This generally completes within working hours.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                <Link href="/">Back to Home</Link>
              </Button>
              <Button
                asChild
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Link href="/doctors">Browse Doctors</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
