import { useState, useMemo, useCallback } from "react";
import { Task, StudySession, Event, Deadline, Reminder } from "@/types";
import { addDays, startOfWeek } from "date-fns";
import { useData } from '@/contexts/DataProvider';
import { updateExternalTask } from "@/api/tasks";
import {
  SchedulableItem,
  UnifiedTask,
  UnifiedEvent,
  UnifiedReminder,
  UnifiedStudySession,
  convertToUnified,
  convertFromUnified,
} from "@/types/unified";

import {
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { CalendarGrid } from "@/components/CalendarGrid";
import { UnifiedItemDialog } from "@/components/UnifiedItemDialog";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6)
  });
  
  const { 
    tasks: allTasks,
    events: allEvents,
    sessions: allSessions,
    reminders: allReminders,
    loading,
    addReminder,
    updateReminder,
    addTask,
    updateTask,
    addEvent,
    updateEvent,
    addSession,
    updateSession,
  } = useData();

  // State for UnifiedItemDialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SchedulableItem | null>(null);
  const [initialItemType, setInitialItemType] = useState<"task" | "event" | "session" | "reminder">("task");
  
  const { toast } = useToast();

  // Optimize data filtering with proper memoization
  const filteredData = useMemo(() => {
    if (!allTasks || !allEvents || !allSessions || !allReminders) {
      return {
        tasks: [],
        events: [],
        sessions: [],
        reminders: [],
        deadlines: []
      };
    }

    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    return {
      tasks: allTasks.filter(task => {
        if (!task.timeSlots?.length) return false;
        return task.timeSlots.some(slot => {
          const slotTime = new Date(slot.startDate).getTime();
          return slotTime >= startTime && slotTime <= endTime;
        });
      }),
      events: allEvents.filter(event => {
        const eventTime = new Date(event.startTime).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      }),
      sessions: allSessions.filter(session => {
        const sessionTime = new Date(session.scheduledFor).getTime();
        return sessionTime >= startTime && sessionTime <= endTime;
      }),
      reminders: allReminders.filter(reminder => {
        const reminderTime = new Date(reminder.reminderTime).getTime();
        return reminderTime >= startTime && reminderTime <= endTime;
      }),
      deadlines: allTasks.filter(task => {
        if (!task.deadline) return false;
        const deadlineTime = new Date(task.deadline).getTime();
        return deadlineTime >= startTime && deadlineTime <= endTime;
      })
    };
  }, [allTasks, allEvents, allSessions, allReminders, dateRange]);

  // Remove individual state variables and use the memoized data
  const { tasks, events, sessions, reminders, deadlines } = filteredData;

  // Memoize handlers to prevent unnecessary re-renders
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  const handleDateSelect = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleAddItem = useCallback((type?: "task" | "event" | "session" | "reminder") => {
    setSelectedItem(null);
    setInitialItemType(type || "task");
    setItemDialogOpen(true);
  }, []);

  const handleItemClick = useCallback((item: Task | Event | StudySession | Deadline | Reminder) => {
    let itemType: "task" | "event" | "session" | "reminder";
    
    if ('name' in item) {
      // Event
      itemType = "event";
    } else if ('subject' in item && 'scheduledFor' in item) {
      // Study session
      itemType = "session";
    } else if ('title' in item && 'reminderTime' in item) {
      // Reminder
      itemType = "reminder";
    } else {
      // Task or deadline
      itemType = "task";
    }
    
    // Convert the item to a unified format
    const unifiedItem = convertToUnified(item, itemType);
    setSelectedItem(unifiedItem);
    setInitialItemType(itemType);
    setItemDialogOpen(true);
  }, []);

  const handleSaveItem = useCallback(async (item: SchedulableItem) => {
    try {
      const originalItem = convertFromUnified(item);
      
      switch (item.itemType) {
        case 'task': {
          const task = item as UnifiedTask;
          if (task.id) {
            // Check if external task
            const existingTask = allTasks.find(t => t.id === task.id);
            if (existingTask?.source && ['google_tasks', 'google_calendar'].includes(existingTask.source)) {
              const shouldUpdate = window.confirm(
                `Do you want to update this task in ${existingTask.source === 'google_tasks' ? 'Google Tasks' : 'Google Calendar'} as well?`
              );
              
              if (shouldUpdate) {
                await updateExternalTask(originalItem);
              }
            }
            
            await updateTask(task.id, originalItem);
            toast({
              title: "Success",
              description: "Task updated successfully",
            });
          } else {
            await addTask(originalItem);
            toast({
              title: "Success",
              description: "Task created successfully",
            });
          }
          break;
        }
        
        case 'event': {
          const event = item as UnifiedEvent;
          if (event.id) {
            await updateEvent(event.id, originalItem);
            toast({
              title: "Success",
              description: "Event updated successfully",
            });
          } else {
            await addEvent(originalItem);
            toast({
              title: "Success",
              description: "Event created successfully",
            });
          }
          break;
        }
        
        case 'session': {
          const session = item as UnifiedStudySession;
          if (session.id) {
            await updateSession(session.id, originalItem);
            toast({
              title: "Success",
              description: "Study session updated successfully",
            });
          } else {
            await addSession(originalItem);
            toast({
              title: "Success",
              description: "Study session created successfully",
            });
          }
          break;
        }
        
        case 'reminder': {
          const reminder = item as UnifiedReminder;
          if (reminder.id) {
            await updateReminder(reminder.id, originalItem);
            toast({
              title: "Success",
              description: "Reminder updated successfully",
            });
          } else {
            await addReminder(originalItem);
            toast({
              title: "Success",
              description: "Reminder created successfully",
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${item.itemType}`,
      });
    }
  }, [allTasks, addEvent, addReminder, addSession, addTask, toast, updateEvent, updateReminder, updateSession, updateTask]);

  // Memoize CalendarGrid to prevent unnecessary re-renders
  const calendarGrid = useMemo(() => (
    <CalendarGrid
      date={date}
      onDateSelect={handleDateSelect}
      onDateRangeChange={handleDateRangeChange}
      events={events}
      tasks={tasks}
      sessions={sessions}
      reminders={reminders}
      deadlines={deadlines}
      onAddItem={() => handleAddItem()}
      onItemClick={handleItemClick}
    />
  ), [date, deadlines, events, handleAddItem, handleDateRangeChange, handleDateSelect, handleItemClick, reminders, sessions, tasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {calendarGrid}
        </>
      )}

      {/* UnifiedItemDialog replaces all individual dialogs */}
      <UnifiedItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        initialItem={selectedItem}
        initialType={initialItemType}
        onSave={handleSaveItem}
        mode={selectedItem ? "edit" : "create"}
      />
    </div>
  );
}
