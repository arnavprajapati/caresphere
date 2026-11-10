"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Standard OPD",
    price: "₹249",
    description: "Pay-as-you-go general consultation",
    features: [
      "1 Verified Doctor OPD visit",
      "Digital prescription & vitals note",
      "Itemized hospital billing invoice",
      "Full HIPAA audit protection",
    ],
    highlight: false,
  },
  {
    name: "Family Care Pack",
    price: "₹999",
    description: "Complete wellness coverage for 4 visits",
    features: [
      "4 Specialist Doctor consultations",
      "Priority slot booking",
      "Continuous health tracking",
      "Front-desk priority check-in",
      "Itemized diagnostic billing",
    ],
    highlight: true,
  },
  {
    name: "Executive Health",
    price: "₹2,499",
    description: "Annual preventive care & specialists",
    features: [
      "10 Specialist & Super-specialist visits",
      "Comprehensive lab test billing discount",
      "Dedicated hospital coordinator",
      "Immediate prescription dispatch",
      "24/7 emergency desk triage",
    ],
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`rounded-3xl transition-all ${
            plan.highlight
              ? "border-2 border-blue-600 bg-white shadow-xl scale-[1.02]"
              : "border border-slate-200 bg-white shadow-xs hover:border-blue-200"
          }`}
        >
          <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                {plan.highlight && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-2">
                {plan.price}
                <span className="text-xs font-normal text-slate-400"> /package</span>
              </div>
              <p className="text-xs text-slate-500">{plan.description}</p>
              <div className="h-px bg-slate-100 my-4" />
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/doctors"
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                plan.highlight
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800"
              }`}
            >
              Select Plan & Book
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Pricing;
