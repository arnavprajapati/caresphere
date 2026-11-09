"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] bg-white text-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-black mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-black mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        We ran into an issue loading this page. Please try again or return to the doctors directory.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs sm:text-sm font-semibold h-10 px-5 cursor-pointer shadow-none"
        >
          Try Again
        </Button>
        <a
          href="/doctors"
          className="text-xs sm:text-sm text-black hover:bg-slate-100 font-semibold px-4 h-10 inline-flex items-center rounded-md border border-slate-300 cursor-pointer transition-colors"
        >
          Back to Doctors
        </a>
      </div>
    </div>
  );
}
