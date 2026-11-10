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

export const dynamic = "force-dynamic";

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
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-xl mx-auto">
        <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none text-center py-0 p-6 sm:p-8 gap-0">
          <CardHeader className="text-center p-0 pb-5">
            <div className="mx-auto w-14 h-14 bg-slate-100 border border-slate-200 text-black rounded-md mb-4 flex items-center justify-center">
              {isRejected ? (
                <XCircle className="h-6 w-6 text-rose-600" />
              ) : (
                <ClipboardCheck className="h-6 w-6 text-black" />
              )}
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1 mx-auto">
              {isRejected
                ? "Clinician Verification Declined"
                : "Verification Under Review"}
            </CardTitle>
            <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
            <CardDescription className="text-sm text-slate-600 mt-3">
              {isRejected
                ? "Your clinician profile requires credential updates"
                : "Your clinician profile is awaiting verification"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 p-0 pt-2">
            {isRejected ? (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left text-xs sm:text-sm text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-black">
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Verification Declined</span>
                </div>
                <p className="leading-relaxed">
                  Please ensure your registration certificate and specialization details are valid, or contact support for assistance.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left text-xs sm:text-sm text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-black">
                  <AlertCircle className="h-4 w-4 text-black shrink-0" />
                  <span>Pending Verification</span>
                </div>
                <p className="leading-relaxed">
                  Your credentials are under review. Your doctor portal will unlock once verified.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Button
                asChild
                variant="outline"
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold h-10 px-5 text-sm shadow-none cursor-pointer"
              >
                <Link href="/">Back to Home</Link>
              </Button>
              <Button
                asChild
                className="rounded-md bg-black hover:bg-neutral-900 text-white font-semibold h-10 px-5 text-sm shadow-none cursor-pointer"
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
