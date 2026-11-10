"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Calendar,
  Clock,
  Medal,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SlotPicker } from "./slot-picker";
import { AppointmentForm } from "./appointment-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DoctorProfile({ doctor, availableDays }) {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const router = useRouter();

  const totalSlots = availableDays?.reduce(
    (total, day) => total + day.slots.length,
    0
  );

  const toggleBooking = () => {
    setShowBooking(!showBooking);
    if (!showBooking) {
      setTimeout(() => {
        document.getElementById("booking-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingComplete = () => {
    router.push("/appointments");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
      {/* Left column - Doctor Profile Card */}
      <div className="md:col-span-1">
        <div className="sticky top-24">
          <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-4 bg-blue-50 border border-blue-100 flex items-center justify-center">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-blue-600" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    Dr. {doctor.name}
                  </h2>
                  <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                </div>

                <Badge
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3"
                >
                  {doctor.specialty}
                </Badge>

                <div className="flex items-center justify-center text-sm text-slate-600 mb-2">
                  <Medal className="h-4 w-4 text-blue-600 mr-1.5" />
                  <span>{doctor.experience} years experience</span>
                </div>

                <div className="text-sm font-semibold text-slate-900 mb-4">
                  Consultation Fee: <span className="text-blue-600 font-extrabold text-base">₹{doctor.consultationFee || 500}</span>
                </div>

                <Button
                  onClick={toggleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl h-11 text-sm shadow-xs"
                >
                  {showBooking ? (
                    <>
                      Hide Booking
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Book Appointment
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right column - Doctor Details and Booking Section */}
      <div className="md:col-span-2 space-y-6">
        <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">
              About Dr. {doctor.name}
            </CardTitle>
            <CardDescription className="text-slate-500">
              Professional credentials, clinical practice, and patient care approach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-slate-900 font-semibold">Description</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {doctor.description}
              </p>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-slate-900 font-semibold">Availability</h3>
              </div>
              {totalSlots > 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  <p>
                    <strong className="text-slate-900">{totalSlots} time slots</strong> available for booking over the next 4 days
                  </p>
                </div>
              ) : (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    No available slots for the next 4 days. Please check back later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Section */}
        {showBooking && (
          <div id="booking-section">
            <Card className="bg-white border border-blue-200 shadow-md rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Select Consultation Slot
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Select a convenient time slot and describe your symptoms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {totalSlots > 0 ? (
                  <>
                    {!selectedSlot && (
                      <SlotPicker
                        days={availableDays}
                        onSelectSlot={handleSlotSelect}
                      />
                    )}

                    {selectedSlot && (
                      <AppointmentForm
                        doctorId={doctor.id}
                        slot={selectedSlot}
                        onBack={() => setSelectedSlot(null)}
                        onComplete={handleBookingComplete}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      No available slots
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      This doctor does not have open slots right now. Please explore other specialists in this department.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
