import { useEffect, useState, useMemo } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, StudySession, Event, Deadline, Reminder } from "@/types";
import { format, isSameDay, addWeeks, startOfWeek } from "date-fns";
import { useData } from '@/contexts/DataProvider';

import {
  Calendar as CalendarIcon,
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
import { WeeklyTimeline } from "@/components/WeeklyTimeline";
import { useToast } from "@/hooks/useToast";
import { ChronologicalView } from "@/components/ChronologicalView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CreateReminderDialog } from "@/components/CreateReminderDialog";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
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
  const [viewType, setViewType] = useState<"categorized" | "chronological">(
    "categorized"
  );
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [deadlines, setDeadlines] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Memoize filtered data using context data
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
      setDeadlines(deadlines.filter(d => d.id !== deadlineId)); 
      toast({
        title: "Success",
        description: "Deadline marked as complete",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark deadline as complete",
      });
      console.error("Error marking deadline as complete:", error);
    }
  };

  const handleDismissReminder = async (reminderId: string) => {
    try {
      await dismissReminder(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId)); 
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
    if (option === "task") {
      setCreateTaskOpen(true);
    } else if (option === "event") {
      setCreateEventOpen(true);
    } else if (option === "session") {
      setCreateSessionOpen(true);
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeek = addWeeks(currentWeek, direction === "next" ? 1 : -1);
    setCurrentWeek(newWeek);
  };

  const handleItemClick = (item: Task | Event | StudySession | Deadline | Reminder) => {
    if ('reminderTime' in item) {
      setSelectedReminder(item);
      setIsReminderDialogOpen(true);
    } else if ('timeSlots' in item) {
      setTaskToEdit(item);
      setCreateTaskOpen(true);
    } else if ('startTime' in item && 'endTime' in item && !('scheduledFor' in item)) {
      setEventToEdit(item);
      setCreateEventOpen(true);
    } else if ('scheduledFor' in item) {
      setSessionToEdit(item);
      setCreateSessionOpen(true);
    }
  };

  const handleCreateTask = async (taskData: Task) => {
    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskData);
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
      setCreateTaskOpen(false);
      setTaskToEdit(null);
    } catch (error) {
      console.error("Error handling task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: taskToEdit ? "Failed to update task" : "Failed to create task",
      });
    }
  };

  const handleCreateEvent = async (eventData: Event) => {
    try {
      if (eventToEdit) {
        await updateEvent(eventToEdit.id, eventData);
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
      setCreateEventOpen(false);
      setEventToEdit(null);
    } catch (error) {
      console.error("Error handling event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: eventToEdit ? "Failed to update event" : "Failed to create event",
      });
    }
  };

  const handleCreateSession = async (sessionData: StudySession) => {
    try {
      if (sessionToEdit) {
        await updateSession(sessionToEdit.id, sessionData);
        console.log("Updated session second time");
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
      setCreateSessionOpen(false);
      setSessionToEdit(null);
    } catch (error) {
      console.error("Error handling session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: sessionToEdit ? "Failed to update session" : "Failed to create session",
      });
    }
  };

  const handleCreateReminder = async (reminderData: Reminder) => {
    try {
      if (selectedReminder) {
        await updateReminder(selectedReminder.id, reminderData);
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
    } catch (error) {
      console.error("Error handling reminder:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create reminder",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          {!isMobile && (
            <ToggleGroup
              type="single"
              value={viewType}
              onValueChange={(value) =>
                value && setViewType(value as "categorized" | "chronological")
              }
            >
              <ToggleGroupItem value="categorized">
                <Grid className="h-4 w-4 mr-2" />
                Categorized
              </ToggleGroupItem>
              <ToggleGroupItem value="chronological">
                <List className="h-4 w-4 mr-2" />
                Chronological
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          <CalendarIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {!isMobile && (
        <WeeklyTimeline
          currentDate={date}
          onDateSelect={setDate}
          onWeekChange={handleWeekChange}
          tasks={tasks}
          events={events}
          sessions={sessions}
          deadlines={deadlines}
          reminders={reminders}
        />
      )}

      <div className="grid gap-6 md:grid-cols-[380px,1fr]">
        <Card className="bg-card">
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Events for {format(date, "MMMM d, yyyy")}</span>
              {isMobile && (
                <ToggleGroup
                  type="single"
                  value={viewType}
                  onValueChange={(value) =>
                    value &&
                    setViewType(value as "categorized" | "chronological")
                  }
                >
                  <ToggleGroupItem value="categorized">
                    <Grid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="chronological">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewType === "chronological" ? (
              <ChronologicalView
                date={date}
                {...chronologicalData}
                onItemClick={handleItemClick}
              />
            ) : (
              <div className="space-y-6">
                {deadlines.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                      Deadlines
                    </h3>
                    <div className="space-y-2">
                      {deadlines.map((deadline) => (
                        <div
                          key={`deadline-${deadline.id}`}
                          className={`flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer
                            ${
                              deadline.source === "google_calendar" || deadline.source === "google_tasks"
                                ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                                : ""
                            }
                            `}
                          onClick={() => handleItemClick(deadline)}
                        >
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(deadline.deadline), "p")}
                            </p>
                            {deadline.title && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {deadline.title}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCompleteDeadline(deadline.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reminders.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-accent" />
                      Reminders
                    </h3>
                    <div className="space-y-2">
                      {reminders.map((reminder) => (
                        <div
                          key={`reminder-${reminder.id}`}
                          className={`flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer`}
                          onClick={() => handleItemClick(reminder)}
                        >
                          <div>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Reminder: {format(new Date(reminder.reminderTime), "p")}
                            </p>
                            {reminder.title && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {reminder.title}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDismissReminder(reminder.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {events.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Events</h3>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className={`flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors
                          ${
                            event.source === "google_calendar"
                              ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                              : ""
                          }
                          `}
                        >
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.startTime), "p")} -{" "}
                              {format(new Date(event.endTime), "p")}
                            </p>
                            {event.location && (
                              <p className="text-sm text-muted-foreground mt-1">
                                📍 {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEventToEdit(event);
                                  setCreateEventOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {event.priority && (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium
                                ${
                                  event.priority === "High"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                    : ""
                                }
                                ${
                                  event.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                                    : ""
                                }
                                ${
                                  event.priority === "Low"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                    : ""
                                }`}
                              >
                                {event.priority}
                              </span>
                            )}
                            {event.category && (
                              <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-full px-2 py-1">
                                {event.category}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tasks.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Tasks</h3>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors
                            ${
                              task.source === "google_calendar" || task.source === "google_tasks"
                                ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                                : ""
                            }
                            `}
                        >
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.timeSlots[0] &&
                                format(
                                  new Date(task.timeSlots[0].startDate),
                                  "p"
                                )}{" "}
                              -{" "}
                              {task.timeSlots[0] &&
                                format(
                                  new Date(task.timeSlots[0].endDate),
                                  "p"
                                )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setCreateTaskOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTaskToDelete(task.id);
                                  setDeleteTaskOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium
                              ${
                                task.priority === "High"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                  : ""
                              }
                              ${
                                task.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  : ""
                              }
                              ${
                                task.priority === "Low"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                  : ""
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`text-xs font-medium rounded-full px-2 py-1
                            ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : ""
                            }
                            ${
                              task.status === "in-progress"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                : ""
                            }
                            ${
                              task.status === "todo"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                : ""
                            }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Study Sessions</h3>
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                        >
                          <div>
                            <p className="font-medium">{session.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.goal}
                            </p>
                            <p className="text-sm mt-1">
                              {format(new Date(session.scheduledFor), "p")} (
                              {session.duration} minutes)
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSessionToEdit(session);
                                  setCreateSessionOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSessionToDelete(session.id);
                                  setDeleteSessionOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <span
                              className={`text-xs font-medium rounded-full px-2 py-1
                            ${
                              session.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : ""
                            }
                            ${
                              session.status === "in-progress"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                : ""
                            }
                            ${
                              session.status === "scheduled"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                                : ""
                            }`}
                            >
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {events.length === 0 &&
                  tasks.length === 0 &&
                  sessions.length === 0 &&
                  deadlines.length === 0 &&
                  reminders.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No events scheduled for this day
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSelectOption={handleAddItemSelect}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={handleCreateEvent}
        initialEvent={eventToEdit}
        mode={eventToEdit ? "edit" : "create"}
        tasks={tasks}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={handleCreateTask}
        initialTask={taskToEdit}
        mode={taskToEdit ? "edit" : "create"}
      />

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSessionCreated={handleCreateSession}
        initialSession={sessionToEdit}
        mode={sessionToEdit ? "edit" : "create"}
        tasks={tasks}
        events={events}
      />

      <CreateReminderDialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        initialReminder={selectedReminder}
        mode={selectedReminder ? "edit" : "create"}
        onReminderCreated={handleCreateReminder}
      />

      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={handleDeleteSession}
      />
    </div>
  );
}
