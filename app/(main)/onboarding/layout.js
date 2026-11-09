import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Onboarding - MediCare",
  description: "Complete your profile to get started with MediCare",
};

export default async function OnboardingLayout({ children }) {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "PATIENT") {
      redirect("/doctors");
    } else if (user.role === "DOCTOR") {
      if (user.verificationStatus === "VERIFIED") {
        redirect("/doctor");
      } else {
        redirect("/doctor/verification");
      }
    } else if (user.role === "FRONT_DESK") {
      redirect("/front-desk");
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return (
    <div className="w-full bg-white text-black px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
