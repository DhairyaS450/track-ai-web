import { useMemo, useState, useEffect, useRef } from "react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  getDay,
  addMinutes,
  isBefore,
  isAfter
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Task, Event, StudySession, Reminder } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getConflictCheckId } from "@/api/conflicts";
import { auth } from "@/config/firebase";

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

interface CalendarGridProps {
  date: Date;
  onDateSelect: (date: Date) => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  events: Event[];
  tasks: Task[];
  sessions: StudySession[];
  reminders: Reminder[];
  deadlines: Task[];
  onAddItem: () => void;
  onItemClick: (item: Task | Event | StudySession | Reminder) => void;
  onConflictClick?: (items: (Task | Event | StudySession)[]) => void;
  ignoredConflictIds: Set<string>;
  onTimeSlotClick?: (date: Date) => void; // Add prop for time slot clicks
}

type CalendarViewType = "day" | "week" | "month" | "schedule";

// Helper function to filter and organize all-day vs. timed events
function processItems(items: any[]) {
  // Separate all-day from timed events
  const allDayItems = items.filter((item: any) => item.isAllDay);
  const timedItems = items.filter((item: any) => !item.isAllDay);
  
  // Return organized structure
  return {
    allDay: allDayItems,
    timed: timedItems
  };
}

export function CalendarGrid({
  date,
  onDateSelect,
  onDateRangeChange,
  events,
  tasks,
  sessions,
  reminders,
  deadlines,
  onAddItem,
  onItemClick,
  onConflictClick,
  ignoredConflictIds,
  onTimeSlotClick, // Add prop to component
}: CalendarGridProps) {
  const [viewType, setViewType] = useState<CalendarViewType>("week");
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Improved state management for cached items
  const [cachedData, setCachedData] = useState({
    events: events || [],
    tasks: tasks || [],
    sessions: sessions || [],
    reminders: reminders || [],
    deadlines: deadlines || []
  });
  
  // Update cached data when props change and are not empty
  useEffect(() => {
    const updates: Partial<{
      events: Event[],
      tasks: Task[],
      sessions: StudySession[],
      reminders: Reminder[],
      deadlines: Task[]
    }> = {};
    let hasUpdates = false;
    
    if (events.length > 0) {
      updates.events = events;
      hasUpdates = true;
    }
    if (tasks.length > 0) {
      updates.tasks = tasks;
      hasUpdates = true;
    }
    if (sessions.length > 0) {
      updates.sessions = sessions;
      hasUpdates = true;
    }
    if (reminders.length > 0) {
      updates.reminders = reminders;
      hasUpdates = true;
    }
    if (deadlines.length > 0) {
      updates.deadlines = deadlines;
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      setCachedData(prev => ({ ...prev, ...updates }));
    }
  }, [events, tasks, sessions, reminders, deadlines]);
  
  // Use cached data as fallback when props are empty
  const effectiveEvents = events.length > 0 ? events : cachedData.events;
  const effectiveTasks = tasks.length > 0 ? tasks : cachedData.tasks;
  const effectiveSessions = sessions.length > 0 ? sessions : cachedData.sessions;
  const effectiveReminders = reminders.length > 0 ? reminders : cachedData.reminders;
  const effectiveDeadlines = deadlines.length > 0 ? deadlines : cachedData.deadlines;
  
  // Debug data at the component level
  console.log(`CalendarGrid rendered with: ${effectiveEvents.length} events, ${effectiveTasks.length} tasks, ${effectiveSessions.length} sessions, view: ${viewType}`);
  
  // Store previous view type to detect changes
  const prevViewTypeRef = useRef(viewType);
  
  // Keep track of whether we've initialized the view
  const initializedRef = useRef(false);
  
  // Ensure we don't lose data when switching between views
  useEffect(() => {
    // If view type changed, log it
    if (prevViewTypeRef.current !== viewType) {
      console.log(`View changed from ${prevViewTypeRef.current} to ${viewType}`);
      prevViewTypeRef.current = viewType;
    }
    
    // Make sure we're initialized
    initializedRef.current = true;
  }, [viewType]);
  
  // Get current view dates
  const viewDates = useMemo(() => {
    switch (viewType) {
      case "day":
        return [date];
      case "week": {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      }
      case "month": {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        // Get day of week for month start (0 = Sunday, 1 = Monday, etc.)
        const startDay = getDay(monthStart);
        // Start from previous month's last days to fill the first week
        const calendarStart = addDays(monthStart, startDay === 0 ? -6 : -(startDay - 1));
        // Add days to fill out the last week
        const endDay = getDay(monthEnd);
        const calendarEnd = addDays(monthEnd, endDay === 0 ? 0 : 7 - endDay);
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      }
      case "schedule":
        return [date];
      default:
        return [date];
    }
  }, [date, viewType]);

  // Move the dateRange update to useEffect instead of during render
  useEffect(() => {
    if (viewDates.length > 0) {
      onDateRangeChange(viewDates[0], viewDates[viewDates.length - 1]);
    }
  }, [viewDates, onDateRangeChange]);

  // Fix the useEffect hook that was resetting view to day on mobile
  useEffect(() => {
    // Only run this effect on initial load, not on subsequent renders
    if (isMobile) {
      const hasInitialized = localStorage.getItem('calendar-mobile-initialized');
      if (!hasInitialized) {
        setViewType("day");
        localStorage.setItem('calendar-mobile-initialized', 'true');
      }
    }
  }, [isMobile]); // Only depend on isMobile, not viewType

  const getAllItemsForDate = (date: Date) => {
    // Standardize the date format for consistent comparison
    // Use start of day in user's local timezone
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const targetTimestamp = targetDate.getTime();
    
    // End of day timestamp for range checks
    const endOfDayTimestamp = targetDate.getTime() + 24 * 60 * 60 * 1000 - 1;
    

    // Get events for this day with improved date comparison logic
    const dayEvents = effectiveEvents.filter(event => {
      if (!event.startTime) return false;
      
      // For all-day events, we need special handling
      if (event.isAllDay) {
        // Extract date parts without time components to avoid timezone issues
        // Handle both YYYY-MM-DD format and ISO format with time
        const eventStartDateStr = event.startTime.includes('T') ? event.startTime.split('T')[0] : event.startTime;
        
        // If the event has an end date (multi-day all-day event)
        if (event.endTime) {
          const eventEndDateStr = event.endTime.includes('T') ? event.endTime.split('T')[0] : event.endTime;
          
          // Event is visible on this day if:
          // 1. Event starts on or before this day AND
          // 2. Event ends on or after this day
          const result = (
            eventStartDateStr <= format(targetDate, "yyyy-MM-dd") && 
            (eventEndDateStr > format(targetDate, "yyyy-MM-dd") || eventEndDateStr === format(targetDate, "yyyy-MM-dd"))
          );
          console.log(`All-day multi-day event "${event.name}": Start=${eventStartDateStr}, End=${eventEndDateStr}, Target=${format(targetDate, "yyyy-MM-dd")}, Visible=${result}`);
          return result;
        }
        
        // Single day all-day event
        const result = eventStartDateStr === format(targetDate, "yyyy-MM-dd");
        console.log(`All-day single-day event "${event.name}": Date=${eventStartDateStr}, Target=${format(targetDate, "yyyy-MM-dd")}, Visible=${result}`);
        return result;
      }
      
      // For timed events, we need to check if the event spans this day
      const eventStart = new Date(event.startTime);
      const eventStartTimestamp = eventStart.getTime();
      
      // For events with start and end times
      if (event.endTime) {
        const eventEnd = new Date(event.endTime);
        const eventEndTimestamp = eventEnd.getTime();
        
        // Event spans this day if:
        // 1. Event starts before end of day AND
        // 2. Event ends after start of day
        return (
          eventStartTimestamp <= endOfDayTimestamp && 
          eventEndTimestamp >= targetTimestamp
        );
      }
      
      // For events with only start time, check if they start on this day
      const eventStartDate = new Date(eventStart);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate.getTime() === targetTimestamp;
    }).map(event => ({
      id: event.id,
      title: event.name,
      start: new Date(event.startTime),
      end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
      type: "event" as const,
      isAllDay: event.isAllDay,
      color: "blue",
      priority: event.priority || "Low",
      item: event
    }));

    console.log(`Found ${dayEvents.length} events for ${format(targetDate, "yyyy-MM-dd")}`);
    
    // Apply similar logic to tasks - add all-day handling for tasks
    const dayTasks = effectiveTasks.filter(task => {
      // For Google Calendar tasks that are due at midnight, treat them as all-day
      if (task.source === 'google_calendar' || task.source === 'google_tasks') {
        if (task.deadline) {
          const deadlineDate = new Date(task.deadline);
          // If time is set to midnight (12:00 AM), treat as all-day task
          if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0) {
            // Extract date part for comparison
            const deadlineDateStr = task.deadline.split('T')[0];
            const result = deadlineDateStr === format(targetDate, "yyyy-MM-dd");
            console.log(`Google task "${task.title}" at midnight: Date=${deadlineDateStr}, Target=${format(targetDate, "yyyy-MM-dd")}, Visible=${result}`);
            
            // Create a special "all-day" flag that we'll use later in the rendering
            if (result) {
              task.isAllDayTask = true;
            }
            
            return result;
          }
        }
      }
      
      // For normal tasks with time slots, use existing logic
      if (!task.timeSlots?.length) return false;
      return task.timeSlots.some(slot => {
        if (!slot.startDate) return false;
        
        const slotStart = new Date(slot.startDate);
        const slotStartTimestamp = slotStart.getTime();
        
        // For slots with end times
        if (slot.endDate) {
          const slotEnd = new Date(slot.endDate);
          const slotEndTimestamp = slotEnd.getTime();
          
          // Slot spans this day if:
          // 1. Slot starts before end of day AND
          // 2. Slot ends after start of day
          return (
            slotStartTimestamp <= endOfDayTimestamp && 
            slotEndTimestamp >= targetTimestamp
          );
        }
        
        // For slots with only start time, check if they start on this day
        const slotStartDate = new Date(slotStart);
        slotStartDate.setHours(0, 0, 0, 0);
        return slotStartDate.getTime() === targetTimestamp;
      });
    }).flatMap(task => {
      // For tasks that we identified as all-day tasks
      if (task.isAllDayTask) {
        return [{
          id: task.id,
          title: task.title,
          start: new Date(task.deadline),
          end: addMinutes(new Date(task.deadline), 30),
          type: "task" as const,
          isAllDay: true, // Mark as all-day
          color: "green",
          priority: task.priority,
          item: task
        }];
      }
      
      // For normal tasks with time slots
      return task.timeSlots
        .filter(slot => {
          if (!slot.startDate) return false;
          
          const slotStart = new Date(slot.startDate);
          const slotStartTimestamp = slotStart.getTime();
          
          // For slots with end times
          if (slot.endDate) {
            const slotEnd = new Date(slot.endDate);
            const slotEndTimestamp = slotEnd.getTime();
            
            // Slot spans this day if:
            // 1. Slot starts before end of day AND
            // 2. Slot ends after start of day
            return (
              slotStartTimestamp <= endOfDayTimestamp && 
              slotEndTimestamp >= targetTimestamp
            );
          }
          
          // For slots with only start time, check if they start on this day
          const slotStartDate = new Date(slotStart);
          slotStartDate.setHours(0, 0, 0, 0);
          return slotStartDate.getTime() === targetTimestamp;
        })
        .map(slot => ({
          id: `${task.id}-${slot.startDate}`,
          title: task.title,
          start: new Date(slot.startDate),
          end: slot.endDate ? new Date(slot.endDate) : addMinutes(new Date(slot.startDate), 60),
          type: "task" as const,
          isAllDay: false,
          color: "green",
          priority: task.priority,
          item: task
        }));
    });

    // Apply similar logic to study sessions
    const daySessions = effectiveSessions.filter(session => {
      if (!session.scheduledFor) return false;
      
      const sessionStart = new Date(session.scheduledFor);
      const sessionStartTimestamp = sessionStart.getTime();
      
      // Calculate session end time based on duration
      const sessionEnd = addMinutes(sessionStart, session.duration || 60);
      const sessionEndTimestamp = sessionEnd.getTime();
      
      // Session spans this day if:
      // 1. Session starts before end of day AND
      // 2. Session ends after start of day
      return (
        sessionStartTimestamp <= endOfDayTimestamp && 
        sessionEndTimestamp >= targetTimestamp
      );
    }).map(session => ({
      id: session.id,
      title: session.subject,
      start: new Date(session.scheduledFor),
      end: addMinutes(new Date(session.scheduledFor), session.duration || 60),
      type: "session" as const,
      isAllDay: false,
      color: "purple",
      priority: "Medium", // Default priority for sessions
      item: session
    }));

    // Standard logic for point-in-time reminders
    const dayReminders = effectiveReminders.filter(reminder => {
      if (!reminder.reminderTime) return false;
      
      const reminderTime = new Date(reminder.reminderTime);
      const reminderDate = new Date(reminderTime);
      reminderDate.setHours(0, 0, 0, 0);
      
      // Reminders should only appear on their exact day
      return reminderDate.getTime() === targetTimestamp;
    }).map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: new Date(reminder.reminderTime),
      end: addMinutes(new Date(reminder.reminderTime), 30),
      type: "reminder" as const,
      isAllDay: false,
      isReminder: true,
      color: "yellow",
      priority: "Medium", // Default priority for reminders
      item: reminder
    }));

    // Standard logic for point-in-time deadlines
    const dayDeadlines = effectiveDeadlines.filter(deadline => {
      if (!deadline.deadline) return false;
      
      const deadlineTime = new Date(deadline.deadline);
      const deadlineDate = new Date(deadlineTime);
      deadlineDate.setHours(0, 0, 0, 0);
      
      // Deadlines should only appear on their exact day
      return deadlineDate.getTime() === targetTimestamp;
    }).map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      start: new Date(deadline.deadline),
      end: addMinutes(new Date(deadline.deadline), 30),
      type: "deadline" as const,
      isAllDay: false,
      color: "red",
      priority: deadline.priority, // Use deadline's priority
      item: deadline
    }));

    const allItems = [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines]
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    console.log(`Total items found for ${format(targetDate, "yyyy-MM-dd")}: ${allItems.length}`);
    return allItems;
  };

  // Handler for clicking on an empty time slot in Day or Week view
  const handleTimeSlotClick = (day: Date, event: React.MouseEvent<HTMLDivElement>) => {
    console.log("handleTimeSlotClick triggered for day:", day);
    if (!onTimeSlotClick) {
      console.log("handleTimeSlotClick skipped: No handler");
      return;
    }
 
     const rect = event.currentTarget.getBoundingClientRect();
     const offsetY = event.clientY - rect.top; // Use clientY relative to viewport top
     console.log("Click details:", { offsetY, clientY: event.clientY, rectTop: rect.top });
 
     // Calculate hour and snap minute to nearest 15-min interval
     const hour = Math.floor(offsetY / HOUR_HEIGHT);
     const minuteFraction = (offsetY % HOUR_HEIGHT) / HOUR_HEIGHT;
     const minute = Math.floor(minuteFraction * 4) * 15; // Snap to 0, 15, 30, 45
     console.log("Calculated time:", { hour, minute });
 
     if (hour >= 0 && hour < 24) { // Ensure click is within valid hours
       const clickedDate = new Date(day);
       clickedDate.setHours(hour, minute, 0, 0);
       console.log("Calculated date:", clickedDate);
       console.log("Calling onTimeSlotClick...");       onTimeSlotClick(clickedDate);
     }
   };

  // Navigation handlers
  const navigatePrevious = () => {
    switch (viewType) {
      case "day":
        onDateSelect(addDays(date, -1));
        break;
      case "week":
        onDateSelect(addDays(date, -7));
        break;
      case "month":
        onDateSelect(subMonths(date, 1));
        break;
      default:
        onDateSelect(addDays(date, -1));
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case "day":
        onDateSelect(addDays(date, 1));
        break;
      case "week":
        onDateSelect(addDays(date, 7));
        break;
      case "month":
        onDateSelect(addMonths(date, 1));
        break;
      default:
        onDateSelect(addDays(date, 1));
    }
  };

  const navigateToday = () => {
    onDateSelect(new Date());
  };

  // Calculate position for an event
  const calculateEventPosition = (start: Date, end: Date) => {
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 24); // Min height of 24px
    
    return { top, height };
  };

  // Check if events overlap
  const doEventsOverlap = (event1: any, event2: any) => {
    return isBefore(event1.start, event2.end) && isAfter(event1.end, event2.start);
  };

  // Detect conflicts between calendar items, respecting ignored pairs
  const detectConflicts = (items: any[], ignoredIds: Set<string>) => {
    const userId = auth.currentUser?.uid; // Get current user ID
    if (!items.length || !userId) return { conflictMap: new Map<string, boolean>(), conflictPairs: new Map<string, any[]>() };

    const conflictMap = new Map<string, boolean>();
    const conflictPairs = new Map<string, any[]>();

    // Check each item against all others for overlaps
    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];

      // Skip all-day events and non-conflicting item types (deadlines and reminders)
      if (item1.isAllDay || item1.type === "deadline" || item1.type === "reminder" || !item1.id) continue;

      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];

        // Skip all-day events and non-conflicting item types (deadlines and reminders)
        if (item2.isAllDay || item2.type === "deadline" || item2.type === "reminder" || !item2.id) continue;

        // ** Check if this specific pair is ignored **
        const conflictCheckId = getConflictCheckId(item1.id, item2.id, userId);
        if (ignoredIds.has(conflictCheckId)) {
           console.log(`Conflict ignored between ${item1.id} and ${item2.id}`);
           continue; // Skip this pair
        }

        // Check if the items overlap
        if (doEventsOverlap(item1, item2)) {
          conflictMap.set(item1.id, true);
          conflictMap.set(item2.id, true);
          
          // Track which items are in conflict with each other
          if (!conflictPairs.has(item1.id)) {
            conflictPairs.set(item1.id, [item1, item2]);
          } else {
            const existing = conflictPairs.get(item1.id) || [];
            if (!existing.some(item => item.id === item2.id)) {
              existing.push(item2);
              conflictPairs.set(item1.id, existing);
            }
          }
          
          if (!conflictPairs.has(item2.id)) {
            conflictPairs.set(item2.id, [item1, item2]);
          } else {
            const existing = conflictPairs.get(item2.id) || [];
            if (!existing.some(item => item.id === item1.id)) {
              existing.push(item1);
              conflictPairs.set(item2.id, existing);
            }
          }
        }
      }
    }
    
    return { conflictMap, conflictPairs };
  };

  // Memoize event columns calculation
  const calculateEventColumns = (events: any[]) => {
    if (!events.length) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Assign columns to events
    const eventColumns: any[] = [];
    sortedEvents.forEach(event => {
      // Find the first column where the event doesn't overlap with existing events
      let column = 0;
      while (eventColumns[column]?.some((existingEvent: any) => doEventsOverlap(existingEvent, event))) {
        column++;
      }
      
      // Initialize the column if it doesn't exist
      if (!eventColumns[column]) {
        eventColumns[column] = [];
      }
      
      // Add the event to the column
      eventColumns[column].push(event);
    });
    
    return eventColumns;
  };

  // Get styling based on item type and priority
  const getTypeStyles = (type: string, priority?: string) => {
    // Base styles for each type
    let typeStyles = "";
    switch (type) {
      case "event":
        typeStyles = "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
        break;
      case "task":
        typeStyles = "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
        break;
      case "session":
        typeStyles = "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300";
        break;
      case "reminder":
        typeStyles = "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
        break;
      case "deadline":
        typeStyles = "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
        break;
      default:
        typeStyles = "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300";
    }
    
    // Priority-based border color
    let priorityStyles = "";
    if (priority) {
      switch (priority) {
        case "High":
          priorityStyles = "border-red-500";
          break;
        case "Medium":
          priorityStyles = "border-amber-500";
          break;
        case "Low":
          priorityStyles = "border-green-500";
          break;
        default:
          priorityStyles = type === "event" ? "border-blue-400" :
                          type === "task" ? "border-green-400" :
                          type === "session" ? "border-purple-400" :
                          type === "reminder" ? "border-yellow-400" :
                          type === "deadline" ? "border-red-400" : "border-gray-400";
      }
    } else {
      // Default border if no priority is specified
      priorityStyles = type === "event" ? "border-blue-400" :
                      type === "task" ? "border-green-400" :
                      type === "session" ? "border-purple-400" :
                      type === "reminder" ? "border-yellow-400" :
                      type === "deadline" ? "border-red-400" : "border-gray-400";
    }
    
    return `${typeStyles} ${priorityStyles}`;
  };

  // Render the calendar view
  return (
    <div className="space-y-4">
      {isMobile ? (
        // Mobile optimized header
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={navigateToday}>
              Today
            </Button>
            <h2 className="text-lg font-bold text-center">
              {viewType === "day" ? (
                format(date, "MMM d, yyyy")
              ) : viewType === "week" ? (
                `${format(viewDates[0], "MMM d")} - ${format(viewDates[viewDates.length - 1], "MMM d")}`
              ) : (
                format(date, "MMMM yyyy")
              )}
            </h2>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={onAddItem}>
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <select 
              className="h-7 border rounded px-1 text-xs bg-muted"
              value={viewType}
              onChange={(e) => setViewType(e.target.value as CalendarViewType)}
            >
              <option value="schedule">Schedule</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>
      ) : (
        // Desktop layout (unchanged)
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex space-x-2 items-center">
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {viewType === "day" ? (
                format(date, "MMMM d, yyyy")
              ) : viewType === "week" ? (
                `${format(viewDates[0], "MMM d")} - ${format(viewDates[viewDates.length - 1], "MMM d, yyyy")}`
              ) : (
                format(date, "MMMM yyyy")
              )}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs value={viewType} onValueChange={(val) => setViewType(val as CalendarViewType)}>
              <TabsList>
                <TabsTrigger value="schedule" className="px-2 py-1 text-xs">Schedule</TabsTrigger>
                <TabsTrigger value="week" className="px-2 py-1 text-xs">Week</TabsTrigger>
                <TabsTrigger value="month" className="px-2 py-1 text-xs">Month</TabsTrigger>
                <TabsTrigger value="day" className="px-2 py-1 text-xs">Day</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button size="sm" variant="outline" onClick={onAddItem}>
              <CalendarIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto pb-4">
        {viewType === "day" && (
          <div className="min-w-full">
            <div className="grid grid-cols-1 gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-2 text-center bg-muted">
                  <div className="font-medium">
                    {format(date, "EEEE")}
                  </div>
                  <div className="text-2xl font-bold">
                    {format(date, "d")}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* All Day Events Section */}
                  <div className="border-b border-gray-200 dark:border-gray-800 p-2">
                    {(() => {
                      const allDayEvents = getAllItemsForDate(date)
                        .filter(item => item.isAllDay);
                        
                      if (allDayEvents.length === 0) {
                        return null;
                      }
                      
                      return (
                        <div className="space-y-1">
                          {allDayEvents.map(item => (
                            <div 
                              key={item.id}
                              className={cn(
                                "px-2 py-1 rounded-md text-xs cursor-pointer border-l-2 overflow-hidden",
                                getTypeStyles(item.type, item.priority),
                                "bg-blue-200 dark:bg-blue-800 font-medium shadow-sm" // Darker blue for all-day events
                              )}
                              onClick={() => onItemClick(item.item)}
                            >
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs opacity-70">All-day</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="relative" 
                    style={{ height: `${24 * HOUR_HEIGHT}px` }} 
                    onClick={(e) => handleTimeSlotClick(date, e)}
                  >
                    {/* Time slots */}
                    {TIME_SLOTS.map((hour) => (
                      <div 
                        key={hour} 
                        className="absolute w-full border-t border-gray-200 dark:border-gray-800 flex"
                        style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      >
                        <div className="w-12 text-xs text-gray-500 pr-2 text-right">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                      </div>
                    ))}
                    
                    {/* Events */}
                    {(() => {
                      // Force a re-evaluation of the available events in this render context
                      console.log(`Day view rendering with: ${effectiveEvents.length} events, ${effectiveTasks.length} tasks, ${effectiveSessions.length} sessions`);
                      const dayEvents = getAllItemsForDate(date)
                        .filter(item => {
                          const eventDate = new Date(item.start);
                          // Only show non-all-day events in the timed grid
                          return format(eventDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") && !item.isAllDay;
                        });
                      
                      if (dayEvents.length === 0) {
                        return (
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                            No events for this day
                          </div>
                        );
                      }
                      
                      const columns = calculateEventColumns(dayEvents);
                      
                      // Detect conflicts for visual indication
                      const { conflictMap, conflictPairs } = detectConflicts(dayEvents, ignoredConflictIds);
                      
                      return columns.map((column, colIndex) => 
                        column.map((event: any) => {
                          const { top, height } = calculateEventPosition(event.start, event.end);
                          const colWidth = 100 / (columns.length || 1);
                          const hasConflict = conflictMap.get(event.id);
                          
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute rounded-md border-l-4 p-1 overflow-hidden shadow-sm cursor-pointer",
                                getTypeStyles(event.type, event.priority)
                              )}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${12 + (colIndex * colWidth)}%`,
                                width: `${colWidth - 1}%`,
                              }}
                              onClick={() => onItemClick(event.item)}
                            >
                              <div className="text-xs font-medium truncate">
                                {event.title} 
                                {hasConflict && onConflictClick && (
                                  <span 
                                    className="ml-1 cursor-pointer" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const conflicts = conflictPairs.get(event.id) || [];
                                      const items = conflicts.map(item => item.item).filter(
                                        item => item.type !== 'deadline' && item.type !== 'reminder'
                                      );
                                      onConflictClick(items);
                                    }}
                                  >
                                    ⚠️
                                  </span>
                                )}
                              </div>
                              <div className="text-xs opacity-70">
                                {event.isAllDay 
                                  ? "All-day" 
                                  : event.isReminder
                                    ? `Reminder at ${format(event.start, "h:mm a")}`
                                    : event.type === "task" || event.type === "deadline"
                                      ? `Due: ${format(event.start, "h:mm a")}`
                                      : `${format(event.start, "h:mm a")} - ${format(event.end, "h:mm a")}`
                                }
                              </div>
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {viewType === "week" && (
          <div className={cn("w-full", isMobile ? "min-w-full" : "min-w-[800px]")}>
            <div className={cn(
              "grid gap-1", 
              isMobile ? "grid-cols-1" : "grid-cols-7 gap-4"
            )}>
              {viewDates.map((day) => (
                <Card 
                  key={day.toISOString()} 
                  className={cn(
                    "overflow-hidden",
                    isSameDay(day, new Date()) && "border-blue-500",
                    isMobile && "border-[1px] mb-2"
                  )}
                >
                  <CardHeader 
                    className={cn(
                      "cursor-pointer text-center",
                      isSameMonth(day, date) ? "bg-muted" : "bg-muted/50",
                      isMobile ? "py-2 px-3" : "p-2"
                    )}
                    onClick={() => {
                      onDateSelect(day);
                      setViewType("day");
                    }}
                  >
                    <div className={cn(
                      "flex items-center justify-between",
                      isMobile ? "flex-row" : "flex-col"
                    )}>
                      <div className={cn("font-medium", isMobile && "text-sm")}>
                        {format(day, "EEE")}
                      </div>
                      <div className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>
                        {format(day, "d")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      {(() => {
                        const items = getAllItemsForDate(day);
                        
                        // Separate all-day from timed events
                        const { allDay, timed } = processItems(items);
                        
                        // Detect conflicts for visual indication
                        const { conflictMap, conflictPairs } = detectConflicts(items, ignoredConflictIds);
                        
                        return (
                          <>
                            {/* All-day events at the top with enhanced styling */}
                            {allDay.length > 0 && (
                              <div className="mb-2">
                                {allDay.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "px-2 py-1 mb-1 rounded-md text-xs cursor-pointer border-l-2",
                                      getTypeStyles(item.type, item.priority),
                                      "bg-blue-200 dark:bg-blue-800 shadow-sm font-medium" // Darker blue for all-day events
                                    )}
                                    onClick={() => onItemClick(item.item)}
                                  >
                                    <div className="font-medium">{item.title}</div>
                                    <div className="text-xs opacity-70">All-day</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Separator line if both all-day and timed events exist */}
                            {allDay.length > 0 && timed.length > 0 && (
                              <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                            )}
                            
                            {/* Timed events below */}
                            {timed.length > 0 && (
                              <>
                                {timed.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "px-2 py-1 mb-1 rounded-md text-xs cursor-pointer border-l-2",
                                      getTypeStyles(item.type, item.priority),
                                      conflictMap.get(item.id) && "border-red-500 border"
                                    )}
                                    onClick={
                                      conflictMap.get(item.id) && conflictPairs.has(item.id)
                                        ? () => onConflictClick && onConflictClick(conflictPairs.get(item.id) || [])
                                        : () => onItemClick(item.item)
                                    }
                                  >
                                    <div className="font-medium truncate">{item.title}</div>
                                    <div className="text-xs opacity-70">
                                      {item.isAllDay 
                                        ? "All-day" 
                                        : item.isReminder
                                          ? `Reminder at ${format(item.start, "h:mm a")}`
                                          : item.type === "task" || item.type === "deadline"
                                            ? `Due: ${format(item.start, "h:mm a")}`
                                            : `${format(item.start, "h:mm a")} - ${format(item.end, "h:mm a")}`
                                      }
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Show empty state if no events */}
                            {items.length === 0 && (
                              <div className="text-xs text-center text-muted-foreground py-1">
                                No events
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {viewType === "month" && (
          <div className={cn("w-full", isMobile ? "min-w-full" : "min-w-[800px]")}>
            <div className="grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={index} className={cn(
                  "text-center font-medium text-sm",
                  isMobile ? "py-1 text-xs" : "py-2"
                )}>
                  {day}
                </div>
              ))}
              
              {viewDates.map((day) => (
                <Card 
                  key={day.toISOString()}
                  className={cn(
                    "overflow-hidden border",
                    isSameDay(day, new Date()) && "border-blue-500",
                    !isSameMonth(day, date) && "opacity-50",
                    isMobile ? "h-[80px]" : "h-[120px]",
                    isMobile && "border-[1px]"
                  )}
                  onClick={() => {
                    onDateSelect(day);
                    setViewType("day");
                  }}
                >
                  <div className={cn(
                    "border-b text-right",
                    isMobile ? "p-0.5" : "p-1"
                  )}>
                    <span className={cn(
                      "inline-block rounded-full text-center",
                      isSameDay(day, new Date()) && "bg-blue-500 text-white",
                      isMobile ? "w-4 h-4 text-[10px] leading-4" : "w-6 h-6 text-xs leading-6"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <ScrollArea className={isMobile ? "h-[55px]" : "h-[90px]"}>
                    <div className={cn(
                      "space-y-1",
                      isMobile ? "p-0.5" : "p-1"
                    )}>
                      {(() => {
                        const items = getAllItemsForDate(day);
                        const { conflictMap, conflictPairs } = detectConflicts(items, ignoredConflictIds);
                        return items.slice(0, isMobile ? 2 : 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "truncate rounded border-l-2",
                              getTypeStyles(event.type, event.priority),
                              isMobile ? "px-0.5 text-[8px]" : "px-1 text-xs"
                            )}
                            onClick={() => onItemClick(event.item)}
                          >
                            {event.title} 
                            {conflictMap.get(event.id) && onConflictClick && (
                              <span 
                                className="ml-1 cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const conflicts = conflictPairs.get(event.id) || [];
                                  const items = conflicts.map(item => item.item).filter(
                                    item => item.type !== 'deadline' && item.type !== 'reminder'
                                  );
                                  onConflictClick(items);
                                }}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                        ));
                      })()}
                      {getAllItemsForDate(day).length > (isMobile ? 2 : 3) && (
                        <div className={cn(
                          "text-center text-muted-foreground",
                          isMobile ? "text-[8px]" : "text-xs"
                        )}>
                          +{getAllItemsForDate(day).length - (isMobile ? 2 : 3)} more
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {viewType === "schedule" && (
          <Card className="w-full">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Schedule - {format(date, "MMMM d, yyyy")}</h3>
              <div className="space-y-3">
                <ScheduleView 
                  date={date}
                  events={effectiveEvents}
                  tasks={effectiveTasks}
                  sessions={effectiveSessions}
                  reminders={effectiveReminders}
                  deadlines={effectiveDeadlines}
                  onItemClick={onItemClick}
                  getTypeStyles={getTypeStyles}
                  detectConflicts={detectConflicts}
                  onConflictClick={onConflictClick}
                  ignoredConflictIds={ignoredConflictIds}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Separate component for Schedule view to avoid IIFE type issues
function ScheduleView({
  date,
  events,
  tasks,
  sessions,
  reminders,
  deadlines,
  onItemClick,
  getTypeStyles,
  detectConflicts,
  onConflictClick,
  ignoredConflictIds
}: {
  date: Date;
  events: Event[];
  tasks: Task[];
  sessions: StudySession[];
  reminders: Reminder[];
  deadlines: Task[];
  onItemClick: (item: any) => void;
  getTypeStyles: (type: string, priority?: string) => string;
  detectConflicts: (items: any[], ignoredIds: Set<string>) => { conflictMap: Map<string, boolean>; conflictPairs: Map<string, any[]> };
  onConflictClick?: (items: (Task | Event | StudySession)[]) => void;
  ignoredConflictIds: Set<string>;
}) {
  // Log component rendering
  console.log(`Schedule view rendering with: ${events.length} events, ${tasks.length} tasks, ${sessions.length} sessions`);
  
  // Standardize date comparison using the exact same approach as getAllItemsForDate
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const targetTimestamp = targetDate.getTime();
  
  // End of day timestamp for range checks
  const endOfDayTimestamp = targetDate.getTime() + 24 * 60 * 60 * 1000 - 1;
  
  // Get YYYY-MM-DD format for string comparisons
  // const targetDateStr = format(targetDate, "yyyy-MM-dd");
  
  console.log(`Schedule view searching for date: ${format(targetDate, "yyyy-MM-dd")}`);
  
  // All event processing uses the exact same logic as getAllItemsForDate 
  // for consistency across views
  const dayEvents = events
    .filter(event => {
      if (!event.startTime) return false;
      
      // For all-day events, we need special handling
      if (event.isAllDay) {
        // Extract date parts without time components to avoid timezone issues
        // Handle both YYYY-MM-DD format and ISO format with time
        const eventStartDateStr = event.startTime.includes('T') ? event.startTime.split('T')[0] : event.startTime;
        
        // If the event has an end date (multi-day all-day event)
        if (event.endTime) {
          const eventEndDateStr = event.endTime.includes('T') ? event.endTime.split('T')[0] : event.endTime;
          
          // Event is visible on this day if:
          // 1. Event starts on or before this day AND
          // 2. Event ends on or after this day
          const matches = (
            eventStartDateStr <= format(targetDate, "yyyy-MM-dd") && 
            (eventEndDateStr > format(targetDate, "yyyy-MM-dd") || eventEndDateStr === format(targetDate, "yyyy-MM-dd"))
          );
          console.log(`Schedule view all-day event check: ${event.name}, Start: ${eventStartDateStr}, End: ${eventEndDateStr}, Matches: ${matches}`);
          return matches;
        }
        
        // Single day all-day event
        const matches = eventStartDateStr === format(targetDate, "yyyy-MM-dd");
        console.log(`Schedule view all-day event check: ${event.name}, Date: ${eventStartDateStr}, Matches: ${matches}`);
        return matches;
      }
      
      // For timed events
      const eventStart = new Date(event.startTime);
      const eventStartTimestamp = eventStart.getTime();
      
      // For events with end times
      if (event.endTime) {
        const eventEnd = new Date(event.endTime);
        const eventEndTimestamp = eventEnd.getTime();
        
        // Event spans this day if:
        // 1. Event starts before end of day AND
        // 2. Event ends after start of day
        const matches = (
          eventStartTimestamp <= endOfDayTimestamp && 
          eventEndTimestamp >= targetTimestamp
        );
        console.log(`Schedule view timed event check: ${event.name}, Start: ${format(eventStart, "yyyy-MM-dd HH:mm")}, End: ${format(eventEnd, "yyyy-MM-dd HH:mm")}, Matches: ${matches}`);
        return matches;
      }
      
      // For events with only start time
      const eventStartDate = new Date(eventStart);
      eventStartDate.setHours(0, 0, 0, 0);
      const matches = eventStartDate.getTime() === targetTimestamp;
      console.log(`Schedule view event check: ${event.name}, Date: ${format(eventStart, "yyyy-MM-dd")}, Matches: ${matches}`);
      return matches;
    })
    .map(event => ({
      id: event.id,
      title: event.name,
      start: new Date(event.startTime),
      end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
      type: "event" as const,
      isAllDay: event.isAllDay,
      color: "blue",
      priority: event.priority || "Low",
      item: event
    }));
    
  console.log(`Schedule view found ${dayEvents.length} events for ${format(targetDate, "yyyy-MM-dd")}`);
  
  // Process tasks with the same logic
  const dayTasks = tasks
    .filter(task => 
      task.timeSlots?.some(slot => {
        if (!slot.startDate) return false;
        
        const slotStart = new Date(slot.startDate);
        const slotStartTimestamp = slotStart.getTime();
        
        // For slots with end times
        if (slot.endDate) {
          const slotEnd = new Date(slot.endDate);
          const slotEndTimestamp = slotEnd.getTime();
          
          // Slot spans this day if:
          // 1. Slot starts before end of day AND
          // 2. Slot ends after start of day
          return (
            slotStartTimestamp <= endOfDayTimestamp && 
            slotEndTimestamp >= targetTimestamp
          );
        }
        
        // For slots with only start time
        const slotStartDate = new Date(slotStart);
        slotStartDate.setHours(0, 0, 0, 0);
        return slotStartDate.getTime() === targetTimestamp;
      })
    )
    .flatMap(task => 
      task.timeSlots
        .filter(slot => {
          if (!slot.startDate) return false;
          
          const slotStart = new Date(slot.startDate);
          const slotStartTimestamp = slotStart.getTime();
          
          // For slots with end times
          if (slot.endDate) {
            const slotEnd = new Date(slot.endDate);
            const slotEndTimestamp = slotEnd.getTime();
            
            // Slot spans this day if:
            // 1. Slot starts before end of day AND
            // 2. Slot ends after start of day
            return (
              slotStartTimestamp <= endOfDayTimestamp && 
              slotEndTimestamp >= targetTimestamp
            );
          }
          
          // For slots with only start time
          const slotStartDate = new Date(slotStart);
          slotStartDate.setHours(0, 0, 0, 0);
          return slotStartDate.getTime() === targetTimestamp;
        })
        .map(slot => ({
          id: `${task.id}-${slot.startDate}`,
          title: task.title,
          start: new Date(slot.startDate),
          end: slot.endDate ? new Date(slot.endDate) : addMinutes(new Date(slot.startDate), 60),
          type: "task" as const,
          isAllDay: false,
          color: "green",
          priority: task.priority,
          item: task
        }))
    );
  
  // Process study sessions with the same logic
  const daySessions = sessions
    .filter(session => {
      if (!session.scheduledFor) return false;
      
      const sessionStart = new Date(session.scheduledFor);
      const sessionStartTimestamp = sessionStart.getTime();
      
      // Calculate session end time based on duration
      const sessionEnd = addMinutes(sessionStart, session.duration || 60);
      const sessionEndTimestamp = sessionEnd.getTime();
      
      // Session spans this day if:
      // 1. Session starts before end of day AND
      // 2. Session ends after start of day
      return (
        sessionStartTimestamp <= endOfDayTimestamp && 
        sessionEndTimestamp >= targetTimestamp
      );
    })
    .map(session => ({
      id: session.id,
      title: session.subject,
      start: new Date(session.scheduledFor),
      end: addMinutes(new Date(session.scheduledFor), session.duration || 60),
      type: "session" as const,
      isAllDay: false,
      color: "purple",
      priority: "Medium", // Default priority for sessions
      item: session
    }));
  
  // Process reminders with the same logic
  const dayReminders = reminders
    .filter(reminder => {
      if (!reminder.reminderTime) return false;
      
      const reminderTime = new Date(reminder.reminderTime);
      const reminderDate = new Date(reminderTime);
      reminderDate.setHours(0, 0, 0, 0);
      
      // Reminders appear only on their exact day
      return reminderDate.getTime() === targetTimestamp;
    })
    .map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: new Date(reminder.reminderTime),
      end: addMinutes(new Date(reminder.reminderTime), 30),
      type: "reminder" as const,
      isAllDay: false,
      isReminder: true,
      color: "yellow",
      priority: "Medium", // Default priority for reminders
      item: reminder
    }));
  
  // Process deadlines with the same logic
  const dayDeadlines = deadlines
    .filter(deadline => {
      if (!deadline.deadline) return false;
      
      const deadlineTime = new Date(deadline.deadline);
      const deadlineDate = new Date(deadlineTime);
      deadlineDate.setHours(0, 0, 0, 0);
      
      // Deadlines appear only on their exact day
      return deadlineDate.getTime() === targetTimestamp;
    })
    .map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      start: new Date(deadline.deadline),
      end: addMinutes(new Date(deadline.deadline), 30),
      type: "deadline" as const,
      isAllDay: false,
      color: "red",
      priority: deadline.priority, // Use deadline's priority
      item: deadline
    }));
  
  // Combine all items 
  const allItems = [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines];
  console.log(`Schedule view - total items found for ${format(targetDate, "yyyy-MM-dd")}: ${allItems.length}`);
  
  if (allItems.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No events for this day
      </div>
    );
  }
  
  // Separate all-day from timed events
  function processItems(items: any[]) {
    return {
      allDay: items.filter(item => item.isAllDay),
      timed: items.filter(item => !item.isAllDay)
    };
  }
  
  // Separate all-day from timed events
  const { allDay, timed } = processItems(allItems);
  
  // Sort timed events by start time
  const sortedTimedItems = [...timed].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Detect conflicts
  const { conflictMap, conflictPairs } = detectConflicts(allItems, ignoredConflictIds);

  // Rest of the component remains the same...
  return (
    <>
      {/* All-day events section with enhanced styling */}
      {allDay.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {allDay.map((item: any) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center border-l-4 rounded-md p-3 cursor-pointer",
                  getTypeStyles(item.type, item.priority),
                  "bg-blue-200 dark:bg-blue-800 shadow-sm" // Darker blue background for all-day events
                )}
                onClick={() => onItemClick(item.item)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-medium">{item.title}</div>
                    {conflictMap.get(item.id) && onConflictClick && (
                      <div 
                        className="ml-2 text-amber-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const conflicts = conflictPairs.get(item.id) || [];
                          const items = conflicts.map(item => item.item).filter(
                            item => item.type !== 'deadline' && item.type !== 'reminder'
                          );
                          onConflictClick(items);
                        }}
                      >
                        ⚠️
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">All-day</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Separator line if both types of events exist */}
      {allDay.length > 0 && sortedTimedItems.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 my-4"></div>
      )}
      
      {/* Timed events section */}
      {sortedTimedItems.length > 0 && (
        <div>
          <div className="space-y-2">
            {sortedTimedItems.map((item: any) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center border-l-4 rounded-md p-3 cursor-pointer",
                  getTypeStyles(item.type, item.priority)
                )}
                onClick={() => onItemClick(item.item)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-medium">{item.title}</div>
                    {conflictMap.get(item.id) && onConflictClick && (
                      <div 
                        className="ml-2 text-amber-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const conflicts = conflictPairs.get(item.id) || [];
                          const items = conflicts.map(item => item.item).filter(
                            item => item.type !== 'deadline' && item.type !== 'reminder'
                          );
                          onConflictClick(items);
                        }}
                      >
                        ⚠️
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {item.isAllDay 
                      ? "All-day" 
                      : item.isReminder
                        ? `Reminder at ${format(item.start, "h:mm a")}`
                        : item.type === "task" || item.type === "deadline"
                          ? `Due: ${format(item.start, "h:mm a")}`
                          : `${format(item.start, "h:mm a")} - ${format(item.end, "h:mm a")}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 