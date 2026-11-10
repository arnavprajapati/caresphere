import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/pricing";

export default async function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-start mb-6">
        <Link
          href="/"
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto mb-12 text-center">
        <Badge
          variant="outline"
          className="bg-blue-50 border-blue-200 px-3 py-1 text-blue-700 text-xs font-semibold rounded-full mb-3"
        >
          Affordable Healthcare Plans
        </Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Simple, Transparent Pricing
        </h1>

        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Choose a consultation package that fits your healthcare needs with zero hidden fees.
        </p>
      </div>

      {/* Pricing Table Section */}
      <Pricing />

      {/* Support Section */}
      <div className="max-w-xl mx-auto mt-16 text-center p-8 bg-slate-50 border border-slate-200 rounded-3xl">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Have Questions About Hospital Packages?
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Contact our patient helpdesk at support@medilink.health or call 1800-MEDILINK
        </p>
        <Link
          href="/doctors"
          className="inline-flex text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all"
        >
          Find a Doctor
        </Link>
      </div>
    </div>
  );
}
