"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SlotPicker({ days, onSelectSlot }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Find first day with slots as default tab
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
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-100/80 p-1 rounded-xl">
          {days
            .filter((day) => !day.isBlocked && day.slots.length > 0)
            .map((day) => (
            <TabsTrigger
              key={day.date}
              value={day.date}
              className="rounded-lg px-4 py-2 font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold">
                  {format(new Date(`${day.date}T00:00:00`), "MMM d")}
                </span>
                <span className="text-slate-500">
                  ({format(new Date(`${day.date}T00:00:00`), "EEE")})
                </span>
              </div>
              {day.slots.length > 0 && (
                <span className="ml-2 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {day.slots.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.date} value={day.date} className="pt-4">
            {day.slots.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No available slots for this day.
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800">
                  {day.displayDate} &bull; Available Times
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {day.slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <Card
                        key={slot.startTime}
                        className={`cursor-pointer transition-all rounded-xl border ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700"
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <CardContent className="p-3 flex items-center justify-center">
                          <Clock
                            className={`h-4 w-4 mr-2 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              isSelected ? "text-white" : "text-slate-800"
                            }`}
                          >
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-xl shadow-xs"
        >
          Continue to Confirm
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
