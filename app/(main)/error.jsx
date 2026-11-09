"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function MainLayoutError({ error, reset }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] bg-white text-black flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-black mb-5">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-black mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-600 max-w-md mb-8">
        We couldn&apos;t load this page right now. Please try again in a moment.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white text-xs sm:text-sm font-semibold px-5 h-10 rounded-md cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-black hover:bg-slate-100 font-semibold px-4 h-10 rounded-md border border-slate-300 cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </a>
      </div>
    </div>
  );
}
