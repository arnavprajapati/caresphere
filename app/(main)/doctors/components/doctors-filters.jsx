"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { SlidersHorizontal, X } from "lucide-react";
import { SPECIALTIES } from "@/lib/specialities";

function buildDoctorsUrl({ specs, exp, fee }) {
  const qs = new URLSearchParams();
  specs.forEach((s) => qs.append("spec", s));
  if (exp) qs.set("exp", exp);
  if (fee) qs.set("fee", fee);
  const query = qs.toString();
  return query ? `/doctors?${query}` : "/doctors";
}

export function DoctorsFilterSidebar({
  currentSpecs = [],
  currentExp = "",
  currentFee = "",
}) {
  const router = useRouter();
  const hasActiveFilters =
    currentSpecs.length > 0 || Boolean(currentExp) || Boolean(currentFee);

  const applyAndScrollTop = (nextState) => {
    const url = buildDoctorsUrl(nextState);
    router.push(url);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleSpecialty = (specName) => {
    const exists = currentSpecs.some(
      (s) => s.toLowerCase() === specName.toLowerCase()
    );
    const nextSpecs = exists
      ? currentSpecs.filter((s) => s.toLowerCase() !== specName.toLowerCase())
      : [...currentSpecs, specName];
    applyAndScrollTop({ specs: nextSpecs, exp: currentExp, fee: currentFee });
  };

  const handleSelectExperience = (val) => {
    const nextExp = currentExp === val ? "" : val;
    applyAndScrollTop({ specs: currentSpecs, exp: nextExp, fee: currentFee });
  };

  const handleSelectFee = (val) => {
    const nextFee = currentFee === val ? "" : val;
    applyAndScrollTop({ specs: currentSpecs, exp: currentExp, fee: nextFee });
  };

  return (
    <Card className="bg-white text-black border border-slate-200 rounded-lg shadow-none py-0 p-6 gap-0 [color-scheme:light]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <h2 className="text-base font-bold text-black flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-black" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => applyAndScrollTop({ specs: [], exp: "", fee: "" })}
            className="text-xs font-semibold text-black hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Filter 1: Specialties (Multi-select instant filter) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
            Specialties
          </label>
          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 [color-scheme:light]">
            {SPECIALTIES.map((s) => {
              const checked = currentSpecs.some(
                (item) => item.toLowerCase() === s.name.toLowerCase()
              );
              return (
                <label
                  key={s.name}
                  className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer hover:text-black"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleSpecialty(s.name)}
                    className="w-4 h-4 accent-black bg-white border-slate-300 rounded cursor-pointer [color-scheme:light]"
                  />
                  <span className={checked ? "font-semibold text-black" : ""}>
                    {s.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter 2: Experience */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
            Experience
          </label>
          <div className="space-y-2">
            {[
              { label: "0 - 5 Years", val: "0-5" },
              { label: "6 - 10 Years", val: "6-10" },
              { label: "11+ Years", val: "11+" },
            ].map((exp) => {
              const checked = currentExp === exp.val;
              return (
                <label
                  key={exp.val}
                  className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer hover:text-black"
                >
                  <input
                    type="radio"
                    name="exp"
                    value={exp.val}
                    checked={checked}
                    onClick={() => handleSelectExperience(exp.val)}
                    onChange={() => {}}
                    className="w-4 h-4 accent-black bg-white border-slate-300 cursor-pointer [color-scheme:light]"
                  />
                  <span className={checked ? "font-semibold text-black" : ""}>
                    {exp.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter 3: Fees */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
            Fees
          </label>
          <div className="space-y-2">
            {[
              { label: "₹100 - ₹500", val: "100-500" },
              { label: "₹500 - ₹1000", val: "500-1000" },
              { label: "₹1000+", val: "1000+" },
            ].map((f) => {
              const checked = currentFee === f.val;
              return (
                <label
                  key={f.val}
                  className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer hover:text-black"
                >
                  <input
                    type="radio"
                    name="fee"
                    value={f.val}
                    checked={checked}
                    onClick={() => handleSelectFee(f.val)}
                    onChange={() => {}}
                    className="w-4 h-4 accent-black bg-white border-slate-300 cursor-pointer [color-scheme:light]"
                  />
                  <span className={checked ? "font-semibold text-black" : ""}>
                    {f.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ActiveFilterChips({
  currentSpecs = [],
  currentExp = "",
  currentFee = "",
}) {
  const router = useRouter();
  const hasActiveFilters =
    currentSpecs.length > 0 || Boolean(currentExp) || Boolean(currentFee);

  if (!hasActiveFilters) return null;

  const navigateWithScrollTop = (nextState) => {
    router.push(buildDoctorsUrl(nextState));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-1 pb-2">
      {currentSpecs.map((spec) => (
        <span
          key={spec}
          className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-md"
        >
          <span>{spec}</span>
          <button
            type="button"
            onClick={() =>
              navigateWithScrollTop({
                specs: currentSpecs.filter((s) => s !== spec),
                exp: currentExp,
                fee: currentFee,
              })
            }
            className="text-slate-500 hover:text-black cursor-pointer"
            aria-label={`Remove ${spec} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {currentExp && (
        <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-md">
          <span>Experience: {currentExp} yrs</span>
          <button
            type="button"
            onClick={() =>
              navigateWithScrollTop({
                specs: currentSpecs,
                exp: "",
                fee: currentFee,
              })
            }
            className="text-slate-500 hover:text-black cursor-pointer"
            aria-label="Remove experience filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {currentFee && (
        <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-md">
          <span>Fee: ₹{currentFee}</span>
          <button
            type="button"
            onClick={() =>
              navigateWithScrollTop({
                specs: currentSpecs,
                exp: currentExp,
                fee: "",
              })
            }
            className="text-slate-500 hover:text-black cursor-pointer"
            aria-label="Remove fee filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={() =>
          navigateWithScrollTop({ specs: [], exp: "", fee: "" })
        }
        className="text-xs font-medium text-slate-500 hover:text-black hover:underline ml-1 cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}
