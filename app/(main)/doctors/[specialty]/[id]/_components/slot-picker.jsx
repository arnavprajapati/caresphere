"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ChevronRight } from "lucide-react";

export function SlotPicker({ days = [], onSelectSlot }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const firstDayWithSlots =
    days.find((day) => day.slots.length > 0)?.date || days[0]?.date;
  const [activeTab, setActiveTab] = useState(firstDayWithSlots);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const confirmSelection = () => {
    if (selectedSlot) {
      onSelectSlot(selectedSlot);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {days.map((day) => (
            <TabsTrigger
              key={day.date}
              value={day.date}
              disabled={day.slots.length === 0}
              className={`rounded-xl text-xs font-semibold px-4 py-2 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs ${
                day.slots.length === 0 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{format(new Date(day.date), "MMM d")}</span>
                <span className="text-slate-400 font-normal">
                  ({format(new Date(day.date), "EEE")})
                </span>
              </div>
              {day.slots.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {day.slots.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.date} value={day.date} className="pt-4">
            {day.slots.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No available consultation slots for this date.
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Available Slots for {day.displayDate}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {day.slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <Card
                        key={slot.startTime}
                        className={`cursor-pointer rounded-xl transition-all border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <CardContent className="p-3 flex items-center justify-center gap-2">
                          <Clock
                            className={`h-3.5 w-3.5 ${
                              isSelected ? "text-white" : "text-blue-600"
                            }`}
                          />
                          <span className="text-xs font-bold">
                            {format(new Date(slot.startTime), "h:mm a")}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button
          onClick={confirmSelection}
          disabled={!selectedSlot}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 shadow-sm"
        >
          Continue to Booking
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
