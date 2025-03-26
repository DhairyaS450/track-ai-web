import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Task, StudySession, Event, Deadline, Reminder } from "@/types";
import { format, isSameDay, addWeeks, startOfWeek, addDays } from "date-fns";
import { useData } from '@/contexts/DataProvider';
import { updateExternalTask } from "@/api/tasks";

import {
  Loader2,
  Edit,
  Trash2,
  AlertCircle,
  List,
  Grid,
  Bell,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CreateStudySessionDialog } from "@/components/CreateStudySessionDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { AddItemDialog } from "@/components/AddItemDialog";
import { useToast } from "@/hooks/useToast";
import { ChronologicalView } from "@/components/ChronologicalView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CreateReminderDialog } from "@/components/CreateReminderDialog";
import { CalendarGrid } from "@/components/CalendarGrid";

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
    deleteTask,
    deleteEvent,
    deleteSession,
    markTaskComplete: markAsComplete,
    dismissReminder,
    addReminder,
    updateReminder,
    addTask,
    updateTask,
    addEvent,
    updateEvent,
    addSession,
    updateSession,
  } = useData();

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [deadlines, setDeadlines] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Memoize filtered data for the selected date
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) =>
      task.timeSlots?.some((slot) =>
        isSameDay(new Date(slot.startDate), date)
      )
    );
  }, [date, allTasks]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) =>
      isSameDay(new Date(event.startTime), date)
    );
  }, [date, allEvents]);

  const filteredSessions = useMemo(() => {
    return allSessions.filter((session) =>
      isSameDay(new Date(session.scheduledFor), date)
    );
  }, [date, allSessions]);

  const filteredDeadlines = useMemo(() => {
    return allTasks.filter((task) =>
      isSameDay(new Date(task.deadline), date)
      // && task.status !== "completed"
    );
  }, [date, allTasks]);

  const filteredReminders = useMemo(() => {
    return allReminders.filter((reminder) =>
      isSameDay(new Date(reminder.reminderTime), date) &&
      reminder.status !== "Dismissed"
    );
  }, [date, allReminders]);

  // Replace useEffects with direct usage of memoized values
  useEffect(() => {
    setTasks(filteredTasks);
  }, [filteredTasks]);

  useEffect(() => {
    setEvents(filteredEvents);
  }, [filteredEvents]);

  useEffect(() => {
    setSessions(filteredSessions);
  }, [filteredSessions]);

  useEffect(() => {
    setDeadlines(filteredDeadlines);
  }, [filteredDeadlines]);

  useEffect(() => {
    setReminders(filteredReminders);
  }, [filteredReminders]);

  // Get all events for the date range (for the calendar grid view)
  const allEventsInRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return allEvents;
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    
    return allEvents.filter(event => {
      const eventTime = new Date(event.startTime).getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [allEvents, dateRange]);

  const allTasksInRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return allTasks;
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    
    return allTasks.filter(task => {
      if (task.timeSlots && task.timeSlots.length > 0) {
        return task.timeSlots.some(slot => {
          const slotTime = new Date(slot.startDate).getTime();
          return slotTime >= startTime && slotTime <= endTime;
        });
      }
      
      if (task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        return deadlineTime >= startTime && deadlineTime <= endTime;
      }
      
      return false;
    });
  }, [allTasks, dateRange]);

  const allSessionsInRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return allSessions;
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    
    return allSessions.filter(session => {
      const sessionTime = new Date(session.scheduledFor).getTime();
      return sessionTime >= startTime && sessionTime <= endTime;
    });
  }, [allSessions, dateRange]);

  const allRemindersInRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return allReminders;
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    
    return allReminders.filter(reminder => {
      const reminderTime = new Date(reminder.reminderTime).getTime();
      return reminderTime >= startTime && reminderTime <= endTime && reminder.status !== "Dismissed";
    });
  }, [allReminders, dateRange]);

  const deadlinesInRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    
    return allTasks.filter(task => {
      if (task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        return deadlineTime >= startTime && deadlineTime <= endTime;
      }
      return false;
    });
  }, [allTasks, dateRange]);

  // Memoize loading state
  const isLoading = useMemo(() => 
    loading,
    [loading]
  );

  // Memoize chronological view data
  const chronologicalData = useMemo(() => ({
    tasks: filteredTasks,
    events: filteredEvents,
    sessions: filteredSessions,
    deadlines: filteredDeadlines,
    reminders: filteredReminders,
  }), [filteredTasks, filteredEvents, filteredSessions, filteredDeadlines, filteredReminders]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task",
      });
    }
    setTaskToDelete(null);
    setDeleteTaskOpen(false);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete);
      toast({
        title: "Success",
        description: "Study session deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete study session",
      });
      console.error("Error deleting study session:", error);
    }
    setSessionToDelete(null);
    setDeleteSessionOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event",
      });
      console.error("Error deleting event:", error);
    }
  };

  const handleCompleteDeadline = async (deadlineId: string) => {
    try {
      await markAsComplete(deadlineId);
      toast({
        title: "Success",
        description: "Task marked as complete",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete task",
      });
      console.error("Error completing task:", error);
    }
  };

  const handleDismissReminder = async (reminderId: string) => {
    try {
      await dismissReminder(reminderId);
      toast({
        title: "Success",
        description: "Reminder dismissed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to dismiss reminder",
      });
      console.error("Error dismissing reminder:", error);
    }
  };

  const handleAddItemSelect = (option: "task" | "event" | "session" | "deadline" | "reminder") => {
    setAddItemOpen(false);
    if (option === "event") setCreateEventOpen(true);
    if (option === "task" || option === "deadline") setCreateTaskOpen(true);
    if (option === "session") setCreateSessionOpen(true);
    if (option === "reminder") setIsReminderDialogOpen(true);
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  const handleItemClick = (item: Task | Event | StudySession | Deadline | Reminder) => {
    if ('name' in item) {
      // Event
      setEventToEdit(item as Event);
      setCreateEventOpen(true);
    } else if ('subject' in item) {
      // Study session
      setSessionToEdit(item as StudySession);
      setCreateSessionOpen(true);
    } else if ('title' in item && 'reminderTime' in item) {
      // Reminder
      setSelectedReminder(item as Reminder);
      setIsReminderDialogOpen(true);
    } else if ('title' in item) {
      // Task or deadline
      setTaskToEdit(item as Task);
      setCreateTaskOpen(true);
    }
  };

  const handleCreateTask = async (taskData: Task) => {
    try {
      if (taskToEdit) {
        if (taskToEdit.source && ['google_tasks', 'google_calendar'].includes(taskToEdit.source)) {
          const shouldUpdate = window.confirm(`Do you want to update this task in ${taskToEdit.source === 'google_tasks' ? 'Google Tasks' : 'Google Calendar'} as well?`);
          
          if (shouldUpdate) {
            await handleUpdateExternalTask({ ...taskToEdit, ...taskData });
          }
        }
        
        await updateTask({ ...taskToEdit, ...taskData });
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        await addTask(taskData);
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      setTaskToEdit(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save task",
      });
      console.error("Error saving task:", error);
    }
  };

  const handleCreateEvent = async (eventData: Event) => {
    try {
      if (eventToEdit) {
        await updateEvent({ ...eventToEdit, ...eventData });
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        await addEvent(eventData);
        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }
      setEventToEdit(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event",
      });
      console.error("Error saving event:", error);
    }
  };

  const handleCreateSession = async (sessionData: StudySession) => {
    try {
      if (sessionToEdit) {
        await updateSession({ ...sessionToEdit, ...sessionData });
        toast({
          title: "Success",
          description: "Study session updated successfully",
        });
      } else {
        await addSession(sessionData);
        toast({
          title: "Success",
          description: "Study session created successfully",
        });
      }
      setSessionToEdit(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save study session",
      });
      console.error("Error saving study session:", error);
    }
  };

  const handleCreateReminder = async (reminderData: Reminder) => {
    try {
      if (selectedReminder) {
        await updateReminder({ ...selectedReminder, ...reminderData });
        toast({
          title: "Success",
          description: "Reminder updated successfully",
        });
      } else {
        await addReminder(reminderData);
        toast({
          title: "Success",
          description: "Reminder created successfully",
        });
      }
      setSelectedReminder(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save reminder",
      });
      console.error("Error saving reminder:", error);
    }
  };

  const handleUpdateExternalTask = async (task: Task) => {
    try {
      await updateExternalTask(task);
      toast({
        title: "Success",
        description: `Task updated in ${task.source === 'google_tasks' ? 'Google Tasks' : 'Google Calendar'}`,
      });
    } catch (error) {
      console.error("Error updating external task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update in ${task.source === 'google_tasks' ? 'Google Tasks' : 'Google Calendar'}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

            {isLoading ? (
        <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
      ) : (
        <>
          <CalendarGrid
                date={date}
            onDateSelect={setDate}
            onDateRangeChange={handleDateRangeChange}
            events={allEventsInRange}
            tasks={allTasksInRange}
            sessions={allSessionsInRange}
            reminders={allRemindersInRange}
            deadlines={deadlinesInRange}
            onAddItem={() => setAddItemOpen(true)}
                onItemClick={handleItemClick}
              />
        </>
      )}

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onOptionSelect={handleAddItemSelect}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={(open) => {
          setCreateTaskOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        onTaskCreated={handleCreateTask}
        initialTask={taskToEdit}
        mode={taskToEdit ? "edit" : "create"}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={(open) => {
          setCreateEventOpen(open);
          if (!open) setEventToEdit(null);
        }}
        onEventCreated={handleCreateEvent}
        initialEvent={eventToEdit}
        mode={eventToEdit ? "edit" : "create"}
        tasks={allTasks.filter(task => !task.completed)}
      />

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={(open) => {
          setCreateSessionOpen(open);
          if (!open) setSessionToEdit(null);
        }}
        onSessionCreated={handleCreateSession}
        initialSession={sessionToEdit}
        mode={sessionToEdit ? "edit" : "create"}
      />

      <CreateReminderDialog
        open={isReminderDialogOpen}
        onOpenChange={(open) => {
          setIsReminderDialogOpen(open);
          if (!open) setSelectedReminder(null);
        }}
        onReminderCreated={handleCreateReminder}
        initialReminder={selectedReminder}
        mode={selectedReminder ? "edit" : "create"}
      />

      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
        onCancel={() => {
          setTaskToDelete(null);
          setDeleteTaskOpen(false);
        }}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={handleDeleteSession}
        onCancel={() => {
          setSessionToDelete(null);
          setDeleteSessionOpen(false);
        }}
      />
    </div>
  );
}
