import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

export function PageHeader({
  icon,
  title,
  backLink = "/",
  backLabel = "Back to Home",
}) {
  return (
    <div className="flex flex-col justify-between gap-4 mb-8">
      <Link href={backLink} className="self-start">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          {backLabel}
        </Button>
      </Link>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-blue-600 bg-blue-50 p-2.5 rounded-2xl border border-blue-100">
            {React.cloneElement(icon, {
              className: "h-7 w-7 text-blue-600",
            })}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
