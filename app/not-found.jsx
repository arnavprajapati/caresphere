import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-white text-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-4">
        <FileQuestion className="h-8 w-8 text-black" />
      </div>
      <h2 className="text-2xl font-bold text-black mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button className="bg-black hover:bg-neutral-900 text-white rounded-md text-xs sm:text-sm font-semibold h-10 px-5 cursor-pointer shadow-none">
            Go Home
          </Button>
        </Link>
        <Link
          href="/doctors"
          className="text-xs sm:text-sm text-black hover:bg-slate-100 font-semibold px-4 h-10 inline-flex items-center rounded-md border border-slate-300 cursor-pointer transition-colors"
        >
          Find Doctors
        </Link>
      </div>
    </div>
  );
}
