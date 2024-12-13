import { useEffect, useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks, deleteTask } from "@/api/tasks";
import { getStudySessions, deleteStudySession } from "@/api/sessions";
import { getEvents, deleteEvent } from "@/api/events";
import { Task, StudySession, Event } from "@/types";
import { format, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CreateStudySessionDialog } from "@/components/CreateStudySessionDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { AddItemDialog } from "@/components/AddItemDialog";
import { useToast } from "@/hooks/useToast";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const { toast } = useToast();

  const fetchEvents = async (selectedDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, sessionsData, eventsData] = await Promise.all([
        getTasks(),
        getStudySessions(),
        getEvents(),
      ]);

      const filteredTasks = tasksData.tasks.filter(task =>
        task.timeSlots.some(slot =>
          isSameDay(new Date(slot.startDate), selectedDate)
        )
      );

      const filteredSessions = sessionsData.sessions.filter(session =>
        isSameDay(new Date(session.scheduledFor), selectedDate)
      );

      const filteredEvents = eventsData.events.filter(event =>
        isSameDay(new Date(event.startTime), selectedDate)
      );

      setTasks(filteredTasks);
      setSessions(filteredSessions);
      setEvents(filteredEvents);
    } catch (err) {
      setError("Failed to load calendar events. Please try again later.");
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(date);
  }, [date]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      await fetchEvents(date);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
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
      await deleteStudySession(sessionToDelete);
      await fetchEvents(date);
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
    }
    setSessionToDelete(null);
    setDeleteSessionOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await fetchEvents(date);
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
    }
  };

  const handleAddItemSelect = (option: 'task' | 'event' | 'session') => {
    setAddItemOpen(false);
    if (option === 'task') {
      setCreateTaskOpen(true);
    } else if (option === 'event') {
      setCreateEventOpen(true);
    } else if (option === 'session') {
      setCreateSessionOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setAddItemOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <CalendarIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[380px,1fr]">
        <Card className="bg-card">
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Events for {format(date, 'MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {events.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Events</h3>
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                          >
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.startTime), 'p')} - {format(new Date(event.endTime), 'p')}
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
                                    ${event.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : ''}
                                    ${event.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : ''}
                                    ${event.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}`}
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
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.timeSlots[0] && format(new Date(task.timeSlots[0].startDate), 'p')} - {task.timeSlots[0] && format(new Date(task.timeSlots[0].endDate), 'p')}
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
                                  ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : ''}
                                  ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : ''}
                                  ${task.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}`}
                              >
                                {task.priority}
                              </span>
                              <span className={`text-xs font-medium rounded-full px-2 py-1
                                ${task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}
                                ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : ''}
                                ${task.status === 'todo' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' : ''}`}
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
                              <p className="text-sm text-muted-foreground">{session.goal}</p>
                              <p className="text-sm mt-1">
                                {format(new Date(session.scheduledFor), 'p')} ({session.duration} minutes)
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
                              <span className={`text-xs font-medium rounded-full px-2 py-1
                                ${session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}
                                ${session.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : ''}
                                ${session.status === 'scheduled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' : ''}`}
                              >
                                {session.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {events.length === 0 && tasks.length === 0 && sessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No events scheduled for this day
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSelectOption={handleAddItemSelect}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={() => {
          fetchEvents(date);
          setCreateEventOpen(false);
          setEventToEdit(null);
        }}
        initialEvent={eventToEdit}
        mode={eventToEdit ? 'edit' : 'create'}
        tasks={tasks}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={() => {
          fetchEvents(date);
          setCreateTaskOpen(false);
          setTaskToEdit(null);
        }}
        initialTask={taskToEdit}
        mode={taskToEdit ? 'edit' : 'create'}
      />

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSessionCreated={() => {
          fetchEvents(date);
          setCreateSessionOpen(false);
          setSessionToEdit(null);
        }}
        initialSession={sessionToEdit}
        mode={sessionToEdit ? 'edit' : 'create'}
        tasks={tasks}
        events={events}
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