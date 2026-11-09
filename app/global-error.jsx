"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-white text-black flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-none max-w-md w-full">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-black flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-black mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            An unexpected error occurred. Please reload the page and try again.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-black hover:bg-neutral-900 text-white text-sm font-semibold h-10 rounded-md cursor-pointer transition-colors"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
