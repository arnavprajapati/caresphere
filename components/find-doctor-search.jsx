"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXPERIENCE_OPTIONS = [
  { value: "0-5", label: "0 - 5 Years" },
  { value: "6-10", label: "6 - 10 Years" },
  { value: "11+", label: "11+ Years" },
];

const FEE_OPTIONS = [
  { value: "100-500", label: "₹100 - ₹500" },
  { value: "500-1000", label: "₹500 - ₹1000" },
  { value: "1000+", label: "₹1000+" },
];

export function FindDoctorSearch({ specialties = [] }) {
  const router = useRouter();
  const [spec, setSpec] = useState("ALL");
  const [exp, setExp] = useState("ALL");
  const [fee, setFee] = useState("ALL");

  const filters = [
    {
      id: "spec",
      label: "Speciality",
      value: spec,
      onChange: setSpec,
      placeholder: "Choose Speciality",
      allLabel: "All Specialties",
      options: specialties.map((name) => ({ value: name, label: name })),
    },
    {
      id: "exp",
      label: "Experience",
      value: exp,
      onChange: setExp,
      placeholder: "Choose Experience",
      allLabel: "Any Experience",
      options: EXPERIENCE_OPTIONS,
    },
    {
      id: "fee",
      label: "Fees Range",
      value: fee,
      onChange: setFee,
      placeholder: "Choose Fees Range",
      allLabel: "Any Fee Range",
      options: FEE_OPTIONS,
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (spec && spec !== "ALL") params.set("spec", spec);
    if (exp && exp !== "ALL") params.set("exp", exp);
    if (fee && fee !== "ALL") params.set("fee", fee);
    const qs = params.toString();
    router.push(qs ? `/doctors?${qs}` : "/doctors");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {filters.map((f) => (
        <div key={f.id}>
          <label
            htmlFor={f.id}
            className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            {f.label}
          </label>
          <Select value={f.value} onValueChange={f.onChange}>
            <SelectTrigger
              id={f.id}
              className="w-full !h-10 bg-white border-slate-300 rounded-md text-sm text-black cursor-pointer shadow-none focus-visible:ring-black/20 focus-visible:border-black"
            >
              <SelectValue placeholder={f.placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-md shadow-md">
              <SelectItem value="ALL" className="cursor-pointer text-sm">
                {f.allLabel}
              </SelectItem>
              {f.options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="cursor-pointer text-sm"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="flex items-end">
        <Button
          type="submit"
          className="w-full bg-black hover:bg-neutral-900 text-white font-semibold h-10 rounded-md shadow-none cursor-pointer"
        >
          Find Doctors
        </Button>
      </div>
    </form>
  );
}
