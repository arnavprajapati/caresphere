"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, ClipboardList, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRole } from "@/actions/onboarding";
import { doctorFormSchema } from "@/lib/schema";
import { SPECIALTIES } from "@/lib/specialities";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";

export default function OnboardingPage() {
  const [step, setStep] = useState("choose-role");
  const [pendingRole, setPendingRole] = useState(null);
  const router = useRouter();

  const { loading, data, fn: submitUserRole } = useFetch(setUserRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      qualification: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  const specialtyValue = watch("specialty");

  const handleRoleSelection = async (role) => {
    if (loading) return;
    setPendingRole(role);
    const formData = new FormData();
    formData.append("role", role);
    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data && data?.success) {
      router.replace(data.redirect);
      router.refresh();
    }
  }, [data, router]);

  const onDoctorSubmit = async (formDataValues) => {
    if (loading) return;
    setPendingRole("DOCTOR");
    const formData = new FormData();
    formData.append("role", "DOCTOR");
    formData.append("specialty", formDataValues.specialty);
    formData.append("qualification", formDataValues.qualification);
    formData.append("experience", formDataValues.experience.toString());
    formData.append("credentialUrl", formDataValues.credentialUrl);
    formData.append("description", formDataValues.description);
    await submitUserRole(formData);
  };

  const roleCards = [
    {
      role: "PATIENT",
      title: "Patient",
      description:
        "Book doctor appointments, view visit notes, and access prescriptions & invoices",
      buttonLabel: "Continue as Patient",
      icon: User,
      onSelect: () => handleRoleSelection("PATIENT"),
    },
    {
      role: "DOCTOR",
      title: "Clinician",
      description:
        "Set schedules, consult patients, add clinical notes, and write prescriptions",
      buttonLabel: "Continue as Doctor",
      icon: Stethoscope,
      onSelect: () => setStep("doctor-form"),
    },
    {
      role: "FRONT_DESK",
      title: "Front-Desk",
      description:
        "Register patients, book appointments, and manage billing invoices (requires admin approval)",
      buttonLabel: "Request Front-Desk Access",
      icon: ClipboardList,
      onSelect: () => handleRoleSelection("FRONT_DESK"),
    },
  ];

  if (step === "choose-role") {
    return (
      <div className="w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Welcome to CareSphere
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-sm text-slate-600 mt-2.5">
            Please select your role to proceed to your dedicated portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {roleCards.map((card) => {
            const Icon = card.icon;
            const isSubmittingThis = loading && pendingRole === card.role;

            return (
              <Card
                key={card.role}
                className="h-full bg-white text-black border border-slate-200 hover:border-black rounded-lg shadow-none transition-colors cursor-pointer flex flex-col justify-between py-0 gap-0"
                onClick={() => !loading && card.onSelect()}
              >
                <CardContent className="p-6 w-full flex flex-col items-center text-center flex-1 justify-between gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-slate-100 text-black rounded-md mb-5 flex items-center justify-center border border-slate-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold text-black mb-2 whitespace-nowrap">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-sm leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-black hover:bg-neutral-900 text-white font-semibold rounded-md h-11 px-4 text-sm whitespace-nowrap cursor-pointer shadow-none"
                    disabled={loading}
                  >
                    {isSubmittingThis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting Up...
                      </>
                    ) : (
                      card.buttonLabel
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Doctor registration form
  if (step === "doctor-form") {
    return (
      <div className="py-4 max-w-2xl mx-auto">
        <Card className="bg-white text-black border border-slate-200 shadow-none rounded-lg p-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-black mb-1">
              Complete Your Clinician Profile
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              Please provide your professional credentials for administrator verification
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-xs font-bold text-slate-800">Medical Specialty</Label>
              <Select
                value={specialtyValue}
                onValueChange={(value) => setValue("specialty", value)}
              >
                <SelectTrigger id="specialty" className="bg-white border-slate-300 rounded-md text-black cursor-pointer">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {SPECIALTIES.map((spec) => (
                    <SelectItem
                      key={spec.name}
                      value={spec.name}
                      className="flex items-center gap-2 text-black hover:bg-slate-100 cursor-pointer"
                    >
                      <span className="text-black">{spec.icon}</span>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qualification" className="text-xs font-bold text-slate-800">Medical Qualification</Label>
              <Input
                id="qualification"
                type="text"
                placeholder="e.g. MBBS, MD (Dermatology)"
                className="bg-white border-slate-300 rounded-md text-black"
                {...register("qualification")}
              />
              {errors.qualification && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {errors.qualification.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-xs font-bold text-slate-800">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 5"
                className="bg-white border-slate-300 rounded-md text-black"
                {...register("experience", { valueAsNumber: true })}
              />
              {errors.experience && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="credentialUrl" className="text-xs font-bold text-slate-800">Medical Degree / Certificate Link</Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/credentials/degree.pdf"
                className="bg-white border-slate-300 rounded-md text-black"
                {...register("credentialUrl")}
              />
              {errors.credentialUrl && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {errors.credentialUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-800">Bio & Care Approach</Label>
              <Textarea
                id="description"
                placeholder="Describe your medical expertise, background, and patient care approach..."
                rows={4}
                className="bg-white border-slate-300 rounded-md text-black text-sm"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs font-medium text-rose-600 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")}
                className="rounded-md border-slate-300 text-black hover:bg-slate-100 cursor-pointer"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-neutral-900 text-white font-semibold rounded-md px-6 cursor-pointer shadow-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }
}
