import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { getGoogleCalendars, syncGoogleCalendars } from "@/api/calendar";
import { Checkbox } from "./ui/checkbox";
import { error } from "console";

interface Calendar {
  id: string;
  summary: string;
}

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch calendars when the dialog opens
      getGoogleCalendars()
        .then((data) => setCalendars(data.calendars))
        .catch((error) =>
          console.error("Error fetching Google Calendars:", error)
        );
    }
  }, [open]);

  const handleToggle = (id: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(id)
        ? prev.filter((calendarId) => calendarId !== id)
        : [...prev, id]
    );
  };

  const handleSync = () => {
    syncGoogleCalendars(selectedCalendars)
      .then(() => {
        console.log("Calendars synced successfully");
        onOpenChange(false);
      })
      .catch((error) => console.error("Error syncing calendars:", error));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Calendars to Sync</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {calendars?.length > 0 ? (
            calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes(calendar.id)}
                  onChange={() => handleToggle(calendar.id)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{calendar.summary}</span>
              </div>
            ))
          ) : (
            <p>No calendars available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={selectedCalendars.length === 0}
          >
            Sync Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
