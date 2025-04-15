import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { StudySession } from "@/types";
import { format, addMinutes, parseISO } from "date-fns";
import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: (startTime: string, duration: number) => void;
  session: StudySession;
}

export function RescheduleSessionDialog({
  open,
  onOpenChange,
  onReschedule,
  session,
}: RescheduleSessionDialogProps) {
  // Parse ISO string to Date object
  const initialStartDate = parseISO(session.scheduledFor);
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [duration, setDuration] = useState(session.duration);

  const calculateEndTime = () => {
    if (!startDate) return null;
    if (!duration) return null;
    return addMinutes(startDate, duration);
  };

  const endDate = calculateEndTime();

  const handleSubmit = () => {
    // Convert the Date back to ISO string format
    const startTimeString = startDate.toISOString();
    onReschedule(startTimeString, duration);
    onOpenChange(false);
  };

  // DateTimePicker component for consistent UI
  const DateTimePicker = ({ 
    date, 
    onDateChange, 
    label 
  }: { 
    date: Date; 
    onDateChange: (date: Date) => void;
    label: string;
  }) => {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate: Date | null) => {
                  if (newDate) {
                    const updatedDate = new Date(newDate);
                    // Preserve time when changing date
                    updatedDate.setHours(
                      date.getHours(),
                      date.getMinutes()
                    );
                    onDateChange(updatedDate);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={"outline"}
                className="w-full"
              >
                <Clock className="mr-2 h-4 w-4" />
                {date ? format(date, "h:mm a") : <span>Select time</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="p-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label htmlFor="hours">Hour</Label>
                      <select
                        id="hours"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={date.getHours()}
                        onChange={(e) => {
                          const newDate = new Date(date);
                          newDate.setHours(parseInt(e.target.value));
                          onDateChange(newDate);
                        }}
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="minutes">Minute</Label>
                      <select
                        id="minutes"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={date.getMinutes()}
                        onChange={(e) => {
                          const newDate = new Date(date);
                          newDate.setMinutes(parseInt(e.target.value));
                          onDateChange(newDate);
                        }}
                      >
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i} value={i}>
                            {i < 10 ? `0${i}` : i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Study Session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <DateTimePicker
            label="New Start Time"
            date={startDate}
            onDateChange={setStartDate}
          />
          
          <div className="grid gap-2">
            <Label>New End Time</Label>
            <div className="px-3 py-2 rounded-md border border-input bg-muted/50">
              {endDate ? format(endDate, "PPP, h:mm a") : "Calculate end time"}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}