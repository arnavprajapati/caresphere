import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CareSphere — Hospital Visits, Appointments & Video Consultations",
  description:
    "Book in-clinic hospital visits or live HD video consultations with verified doctors, with front-desk check-in, digital prescriptions, and billing.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="light">
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className} bg-white text-slate-900 antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col bg-white">
              <Header />
              <main className="flex-1 pt-16">{children}</main>
              <Toaster richColors position="top-right" />

              {/* CareSphere Clean Footer */}
              <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 mt-16">
                <div className="container mx-auto px-4 lg:px-8 py-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-200">
                    <div className="space-y-2.5 max-w-sm">
                      <Link href="/" className="inline-flex flex-col items-start">
                        <span className="text-2xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent px-0.5 leading-none">
                          CareSphere
                        </span>
                        <div className="mt-1 h-[3px] w-16 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
                      </Link>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Verified specialists, in-clinic hospital visits, live HD video consultations, and digital prescriptions in one connected workspace.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm font-semibold text-slate-800">
                      <Link href="/doctors" className="hover:text-black transition-colors">
                        Find Doctors
                      </Link>
                      <Link href="/appointments" className="hover:text-black transition-colors">
                        Appointments
                      </Link>
                      <Link href="/pricing" className="hover:text-black transition-colors">
                        Pricing
                      </Link>
                      <Link href="/onboarding" className="hover:text-black transition-colors">
                        Get Started
                      </Link>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <p>
                      &copy; {new Date().getFullYear()} CareSphere Healthcare Network. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <span>In-Clinic &amp; Video Care</span>
                      <span>&bull;</span>
                      <span>Verified Clinicians</span>
                      <span>&bull;</span>
                      <span>Digital Prescriptions</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
