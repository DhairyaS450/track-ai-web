import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  getGoogleCalendars,
  getGoogleTaskLists,
  syncWithGoogle,
} from "@/api/calendar"; // Import tasklists API

interface Calendar {
  id: string;
  summary: string;
}

interface TaskList {
  id: string;
  title: string;
}

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [selectedTaskLists, setSelectedTaskLists] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch calendars and tasklists when the dialog opens
      Promise.all([getGoogleCalendars(), getGoogleTaskLists()])
        .then(([calendarData, taskListData]) => {
          setCalendars(calendarData.calendars || []);
          setTaskLists(taskListData.taskLists || []);
        })
        .catch((error) => console.error("Error fetching Google data:", error));
    }
  }, [open]);

  const handleToggleCalendar = (id: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(id)
        ? prev.filter((calendarId) => calendarId !== id)
        : [...prev, id]
    );
  };

  const handleToggleTaskList = (id: string) => {
    setSelectedTaskLists((prev) =>
      prev.includes(id)
        ? prev.filter((taskListId) => taskListId !== id)
        : [...prev, id]
    );
  };

  const handleSync = () => {
    syncWithGoogle(selectedCalendars, selectedTaskLists)
      .then(() => {
        console.log("Calendars and Tasklists synced successfully");
        onOpenChange(false);
      })
      .catch((error) =>
        console.error("Error syncing calendars and tasklists:", error)
      );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Calendars and Tasklists to Sync</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h3 className="text-lg font-semibold">Calendars</h3>
          <div className="max-h-60 overflow-y-auto">
          {calendars?.length > 0 ? (
            calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes(calendar.id)}
                  onChange={() => handleToggleCalendar(calendar.id)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{calendar.summary}</span>
              </div>
            ))
          ) : (
            <p>No calendars available.</p>
          )}
          </div>
          <h3 className="text-lg font-semibold mt-4">Tasklists</h3>
          <div className="max-h-60 overflow-y-auto">
            {taskLists?.length > 0 ? (
              taskLists.map((taskList) => (
                <div key={taskList.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTaskLists.includes(taskList.id)}
                    onChange={() => handleToggleTaskList(taskList.id)}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>{taskList.title}</span>
                </div>
              ))
            ) : (
              <p>No tasklists available.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={
              selectedCalendars.length === 0 && selectedTaskLists.length === 0
            }
          >
            Sync Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
