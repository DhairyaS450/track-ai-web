import { useState, useMemo, useCallback, useEffect } from "react";
import { Task, StudySession, Event, Deadline, Reminder } from "@/types";
import { addDays, startOfWeek, format } from "date-fns";
import { useData } from '@/contexts/DataProvider';
import { updateExternalTask } from "@/api/tasks";
import { getIgnoredConflicts, getConflictCheckId } from "@/api/conflicts";
import { auth } from '@/config/firebase';
import {
  SchedulableItem,
  UnifiedTask,
  UnifiedEvent,
  UnifiedReminder,
  UnifiedStudySession,
  convertToUnified,
  convertFromUnified,
  ItemType
} from "@/types/unified";

import {
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { CalendarGrid } from "@/components/CalendarGrid";
import { UnifiedItemDialog } from "@/components/UnifiedItemDialog";
import { CalendarConflictPopup } from "@/components/CalendarConflictPopup";

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
    deleteReminder,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addSession,
    updateSession,
    deleteSession,
  } = useData();

  // State for UnifiedItemDialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SchedulableItem | null>(null);
  const [initialItemType, setInitialItemType] = useState<"task" | "event" | "session" | "reminder">("task");
  
  // State for conflict handling
  const [conflictPopupOpen, setConflictPopupOpen] = useState(false);
  const [conflictingItems, setConflictingItems] = useState<SchedulableItem[]>([]);
  const [ignoredConflictIds, setIgnoredConflictIds] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  // Fetch ignored conflicts on mount/user change
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
        getIgnoredConflicts(userId)
            .then(ids => {
                console.log("Fetched ignored conflict IDs:", ids);
                setIgnoredConflictIds(ids);
            })
            .catch(error => {
                console.error("Error fetching ignored conflicts:", error);
                // Optionally show a toast
            });
    }
    // Consider adding a listener for auth state changes if not handled by DataProvider
  }, [auth.currentUser]);

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

    // Set date range boundary to entire days (midnight to midnight)
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    const startTime = startDate.getTime();
    
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    const endTime = endDate.getTime();
    
    console.log(`Filtering for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return {
      tasks: allTasks.filter(task => {
        // For Google Calendar tasks due at midnight, mark them as all-day
        if ((task.source === 'google_calendar' || task.source === 'google_tasks') && task.deadline) {
          const deadlineDate = new Date(task.deadline);
          // If time is set to midnight (12:00 AM), treat as all-day
          if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0) {
            const deadlineDateStr = task.deadline.split('T')[0];
            const startDateStr = format(startDate, "yyyy-MM-dd");
            const endDateStr = format(endDate, "yyyy-MM-dd");
            
            // Check if deadline falls within the date range
            if (deadlineDateStr >= startDateStr && deadlineDateStr <= endDateStr) {
              task.isAllDayTask = true;
              return true;
            }
          }
        }
        
        // Normal task time slot filtering
        if (!task.timeSlots?.length) return false;
        return task.timeSlots.some(slot => {
          if (!slot.startDate) return false;
          const slotStart = new Date(slot.startDate).getTime();
          
          // If slot has end date, check if it overlaps with the range
          if (slot.endDate) {
            const slotEnd = new Date(slot.endDate).getTime();
            return (slotStart <= endTime && slotEnd >= startTime);
          }
          
          // If no end date, just check if start is in range
          return (slotStart >= startTime && slotStart <= endTime);
        });
      }),
      
      events: allEvents.filter(event => {
        // Debug events being filtered
        console.log(`Filtering event: ${event.name}, isAllDay: ${event.isAllDay}, startTime: ${event.startTime}, endTime: ${event.endTime || 'none'}`);
        
        // All-day events need special handling
        if (event.isAllDay) {
          if (!event.startTime) return false;
          
          // For all-day events, just compare the date parts (YYYY-MM-DD)
          const eventDateStr = event.startTime.includes('T') ? event.startTime.split('T')[0] : event.startTime;
          const startDateStr = format(startDate, "yyyy-MM-dd");
          const endDateStr = format(endDate, "yyyy-MM-dd");
          
          // Google Calendar uses exclusive end dates (end date is day after)
          // If endTime is set, it's the exclusive end date
          if (event.endTime) {
            const eventEndDateStr = event.endTime.includes('T') ? event.endTime.split('T')[0] : event.endTime;
            
            // Check if event overlaps with range (event starts before range ends AND event ends after range starts)
            const result = (
              eventDateStr <= endDateStr && 
              (eventEndDateStr >= startDateStr || eventEndDateStr === startDateStr)
            );
            console.log(`All-day event "${event.name}": Start=${eventDateStr}, End=${eventEndDateStr}, StartRange=${startDateStr}, EndRange=${endDateStr}, Visible=${result}`);
            return result;
          }
          
          // If no end date, just check if the single day is in range
          const result = (eventDateStr >= startDateStr && eventDateStr <= endDateStr);
          console.log(`Single day all-day event "${event.name}": Date=${eventDateStr}, StartRange=${startDateStr}, EndRange=${endDateStr}, Visible=${result}`);
          return result;
        }
        
        // Regular timed events
        const eventStart = new Date(event.startTime).getTime();
        
        // If event has end time, check for overlap
        if (event.endTime) {
          const eventEnd = new Date(event.endTime).getTime();
          // Event overlaps with range if it starts before range ends AND ends after range starts
          return (eventStart <= endTime && eventEnd >= startTime);
        }
        
        // If no end time, just check if start is in range
        return (eventStart >= startTime && eventStart <= endTime);
      }),
      
      sessions: allSessions.filter(session => {
        if (!session.scheduledFor) return false;
        const sessionStart = new Date(session.scheduledFor).getTime();
        const sessionEnd = session.duration 
          ? sessionStart + (session.duration * 60 * 1000)
          : sessionStart + (60 * 60 * 1000); // Default 1 hour
          
        // Session overlaps with range if it starts before range ends AND ends after range starts
        return (sessionStart <= endTime && sessionEnd >= startTime);
      }),
      
      reminders: allReminders.filter(reminder => {
        if (!reminder.reminderTime) return false;
        const reminderTime = new Date(reminder.reminderTime).getTime();
        return (reminderTime >= startTime && reminderTime <= endTime);
      }),
      
      deadlines: allTasks.filter(task => {
        if (!task.deadline) return false;
        
        // Handle Google Calendar tasks with midnight deadlines differently
        if ((task.source === 'google_calendar' || task.source === 'google_tasks') && task.deadline) {
          const deadlineDate = new Date(task.deadline);
          // If time is set to midnight (12:00 AM), we've already marked it as all-day
          // but we still want it to appear in deadlines
          if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0) {
            const deadlineDateStr = task.deadline.split('T')[0];
            const startDateStr = format(startDate, "yyyy-MM-dd");
            const endDateStr = format(endDate, "yyyy-MM-dd");
            
            // Check if deadline falls within the date range
            return (deadlineDateStr >= startDateStr && deadlineDateStr <= endDateStr);
          }
        }
        
        // Regular deadline handling
        const deadlineTime = new Date(task.deadline).getTime();
        return (deadlineTime >= startTime && deadlineTime <= endTime);
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

  // Handle delete item from UnifiedItemDialog
  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      if (selectedItem) {
        switch (selectedItem.itemType) {
          case 'task':
            await deleteTask(itemId);
            toast({ title: "Success", description: "Task deleted successfully" });
            break;
          case 'event':
            await deleteEvent(itemId);
            toast({ title: "Success", description: "Event deleted successfully" });
            break;
          case 'session':
            await deleteSession(itemId);
            toast({ title: "Success", description: "Study session deleted successfully" });
            break;
          case 'reminder':
            await deleteReminder(itemId);
            toast({ title: "Success", description: "Reminder deleted successfully" });
            break;
        }
        setItemDialogOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item",
      });
    }
  }, [selectedItem, deleteTask, deleteEvent, deleteSession, deleteReminder, toast]);

  // Conflict handling functions
  const handleConflictClick = useCallback((items: (Task | Event | StudySession)[]) => {
    // Log the items to see what we're dealing with
    console.log("Conflict items received from grid:", items);
    
    // Ensure we have at least two items to have a conflict
    if (items.length < 2) {
        console.warn("Conflict click triggered with less than 2 items:", items);
        return; // No conflict if fewer than 2 items
    }

    // Convert items to unified format before setting state
    const unifiedItems = items.map(item => {
        let itemType: "task" | "event" | "session"; // Reminders shouldn't cause scheduling conflicts
        if ('name' in item) {
            itemType = "event";
        } else if ('subject' in item && 'scheduledFor' in item) {
            itemType = "session";
        } else {
            itemType = "task";
        }
        return convertToUnified(item, itemType);
    });

    console.log("Unified conflict items:", unifiedItems);
    setConflictingItems(unifiedItems);
    setConflictPopupOpen(true);
  }, [convertToUnified, setConflictingItems, setConflictPopupOpen]); // Add dependencies
  
  const handleConflictResolved = useCallback(() => {
    setConflictPopupOpen(false);
    setConflictingItems([]);
    // Optionally trigger a data refresh if needed, though DataProvider might handle it
    toast({
        title: "Success",
        description: "Conflict resolved successfully.",
    });
  }, [setConflictPopupOpen, setConflictingItems, toast]);

  // Handlers for manual actions in the conflict popup
  const handleRescheduleConflict = useCallback(async (itemId: string, itemType: ItemType, newStartTime: string, newEndTime?: string) => {
    try {
      console.log(`Manual Reschedule - ID: ${itemId}, Type: ${itemType}, Start: ${newStartTime}, End: ${newEndTime}`);
      switch (itemType) {
        case 'task': {
          // Assuming we update the first timeslot if it exists
          const task = allTasks.find(t => t.id === itemId);
          if (task?.timeSlots?.[0]) {
            const updatedTimeSlots = [...task.timeSlots];
            updatedTimeSlots[0] = { ...updatedTimeSlots[0], startDate: newStartTime, endDate: newEndTime || updatedTimeSlots[0].endDate };
            await updateTask(itemId, { timeSlots: updatedTimeSlots });
          } else {
             // Handle tasks without timeslots or find a better way?
             await updateTask(itemId, { /* Update appropriate field if no timeslot */ }); 
          }
          break;
        }
        case 'event':
          await updateEvent(itemId, { startTime: newStartTime, endTime: newEndTime });
          break;
        case 'session':
          await updateSession(itemId, { scheduledFor: newStartTime }); // Duration is usually fixed
          break;
        default:
          throw new Error(`Unknown item type for reschedule: ${itemType}`);
      }
      toast({ title: "Success", description: `${itemType} manually rescheduled.` });
      handleConflictResolved(); // Close popup on success
    } catch (error) {
      console.error("Error manually rescheduling item:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to reschedule ${itemType}` });
    }
  }, [allTasks, updateTask, updateEvent, updateSession, toast, handleConflictResolved]);

  const handleDeleteConflict = useCallback(async (itemId: string, itemType: ItemType) => {
    try {
      console.log(`Manual Delete - ID: ${itemId}, Type: ${itemType}`);
       switch (itemType) {
        case 'task':
          await deleteTask(itemId);
          break;
        case 'event':
          await deleteEvent(itemId);
          break;
        case 'session':
          await deleteSession(itemId);
          break;
        default:
          throw new Error(`Unknown item type for delete: ${itemType}`);
      }
      toast({ title: "Success", description: `${itemType} manually deleted.` });
      handleConflictResolved(); // Close popup on success
    } catch (error) {
      console.error("Error manually deleting item:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to delete ${itemType}` });
    }
  }, [deleteTask, deleteEvent, deleteSession, toast, handleConflictResolved]);

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
      onConflictClick={handleConflictClick}
      ignoredConflictIds={ignoredConflictIds}
    />
  ), [date, deadlines, events, handleAddItem, handleConflictClick, handleDateRangeChange, handleDateSelect, handleItemClick, reminders, sessions, tasks, ignoredConflictIds]);

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
        onDelete={handleDeleteItem}
        mode={selectedItem ? "edit" : "create"}
      />
      
      {/* Conflict Popup */}
      <CalendarConflictPopup
        open={conflictPopupOpen}
        onOpenChange={setConflictPopupOpen}
        conflictingItems={conflictingItems}
        onResolve={handleConflictResolved}
        onReschedule={handleRescheduleConflict}
        onDelete={handleDeleteConflict}
      />
    </div>
  );
}
