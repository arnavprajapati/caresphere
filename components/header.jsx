import React from "react";
import { Button } from "./ui/button";
import {
  Calendar,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  Search,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { Badge } from "./ui/badge";

const ROLE_DASHBOARD_LINKS = {
  ADMIN: [
    { href: "/admin", label: "Admin Panel", Icon: ShieldCheck },
    { href: "/front-desk", label: "Front Desk", Icon: ClipboardList },
  ],
  FRONT_DESK: [{ href: "/front-desk", label: "Front Desk", Icon: ClipboardList }],
  DOCTOR: [{ href: "/doctor", label: "Doctor Dashboard", Icon: Stethoscope }],
  PATIENT: [{ href: "/appointments", label: "My Appointments", Icon: Calendar }],
  UNASSIGNED: [{ href: "/onboarding", label: "Choose Role", Icon: null, primary: true }],
};

export default async function Header() {
  const user = await checkUser();
  const dashboardLinks =
    user?.role === "FRONT_DESK" && user.verificationStatus !== "VERIFIED"
      ? [{ href: "/front-desk-verification", label: "Approval Status", Icon: ClipboardList }]
      : user?.role
      ? ROLE_DASHBOARD_LINKS[user.role] ?? []
      : [];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 shadow-xs">
      <nav className="container mx-auto px-4 lg:px-8 h-full flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] gap-3">
        {/* Left: Brand Logo */}
        <Link href="/" className="inline-flex flex-col items-center group shrink-0 md:justify-self-start">
          <span className="text-2xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent px-1 leading-none">
            CareSphere
          </span>
          <div className="mt-1 h-[3px] w-16 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
        </Link>

        {/* Center: Find Doctors + Role Buttons */}
        <div className="flex items-center justify-center gap-2 md:justify-self-center">
          <Link href="/doctors" className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold h-9 px-3 sm:px-3.5 cursor-pointer shadow-none"
            >
              <Search className="h-4 w-4 sm:mr-1.5 text-black" />
              <span className="hidden sm:inline">Find Doctors</span>
            </Button>
          </Link>

          <SignedIn>
            {dashboardLinks.map(({ href, label, Icon, primary }) => (
              <Link key={href} href={href} className="cursor-pointer">
                <Button
                  variant={primary ? "default" : "outline"}
                  size="sm"
                  className={
                    primary
                      ? "rounded-md bg-black hover:bg-neutral-900 text-white font-semibold h-9 px-3.5 cursor-pointer shadow-none"
                      : "rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 font-semibold h-9 px-3 sm:px-3.5 cursor-pointer shadow-none"
                  }
                >
                  {Icon && <Icon className="h-4 w-4 sm:mr-1.5 text-black" />}
                  <span className={Icon ? "hidden sm:inline" : ""}>{label}</span>
                </Button>
              </Link>
            ))}
          </SignedIn>
        </div>

        {/* Right: Role Badge + Profile (or Login/Signup when signed out) */}
        <div className="flex items-center gap-2.5 shrink-0 md:justify-self-end">
          <SignedOut>
            <SignInButton>
              <Button
                variant="outline"
                className="rounded-md bg-white border-slate-300 text-black hover:bg-slate-100 px-4 h-9 text-sm font-semibold cursor-pointer shadow-none"
              >
                Log in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button
                className="rounded-md bg-black hover:bg-neutral-900 text-white px-4 h-9 text-sm font-semibold cursor-pointer shadow-none"
              >
                Signup
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {user?.role && user.role !== "UNASSIGNED" && (
              <Badge
                variant="outline"
                className="inline-flex bg-black text-white border-black text-xs font-semibold px-3 py-1 rounded-md"
              >
                {user.role.replace("_", " ")}
              </Badge>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-1 ring-slate-300",
                  userButtonPopoverCard: "shadow-2xl border border-slate-100 rounded-2xl",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
