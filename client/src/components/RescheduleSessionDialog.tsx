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
import { format, addMinutes } from "date-fns";
import { useState } from "react";

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
  const [startTime, setStartTime] = useState(session.scheduledFor.slice(0, 16));
  const [duration, setDuration] = useState(session.duration);

  const calculateEndTime = () => {
    if (!startTime) return "";
    if (!duration) return "";
    const start = new Date(startTime);
    const end = addMinutes(start, duration);
    return format(end, "yyyy-MM-dd'T'HH:mm");
  };

  const handleSubmit = () => {
    onReschedule(startTime, duration);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Study Session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="col-span-4">
              New Start Time
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="col-span-4">
              New End Time
            </Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={calculateEndTime()}
              disabled
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="col-span-4">
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value == '' ? 0 : parseInt(e.target.value))}
              min="1"
              className="col-span-4"
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