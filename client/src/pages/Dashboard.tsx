import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { postponeStudySession } from "@/api/sessions";
import { Task, StudySession, Event, Reminder } from "@/types";
import {
  format,
  isPast,
  isToday,
  isValid,
  isTomorrow,
} from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Clock,
  Bell,
  ChevronDown,
  CalendarDays,
  Play,
  MoreVertical,
  Sparkles,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { ViewAllTasksDialog } from "@/components/ViewAllTasksDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { PostponeSessionDialog } from "@/components/PostponeSessionDialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EventsTimeline } from "@/components/EventsTimeline";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { CreateStudySessionDialog } from "@/components/CreateStudySessionDialog";
import { useData } from "@/contexts/DataProvider";

export function Dashboard() {
  console.log('Dashboard');
  const {
    tasks: allTasks,
    events: allEvents,
    sessions: allSessions,
    reminders: allReminders,
    loading: loading,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    markTaskComplete: markAsComplete,
    dismissReminder,
  } = useData();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [viewAllTasksOpen, setViewAllTasksOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);
  const [isTodayOpen, setIsTodayOpen] = useState(false);
  const [isHighPriorityOpen, setIsHighPriorityOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [postponeSessionOpen, setPostponeSessionOpen] = useState(false);
  const [sessionToPostpone, setSessionToPostpone] = useState<string | null>(
    null
  );
  const setDeadlines = useState<Task[]>([])[1];
  const setReminders = useState<Reminder[]>([])[1];
  const { toast } = useToast();
  
  // Store motivational quote in state so it doesn't change on re-renders
  const [motivationalQuote, setMotivationalQuote] = useState<string>('');

  // Helper functions for safe date handling
  const isValidDate = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return isValid(date);
  };

  const isTodaySafe = (dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isToday(new Date(dateStr as string));
  };

  const isTomorrowSafe = (dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isTomorrow(new Date(dateStr as string));
  };

  const isPastSafe = (dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isPast(new Date(dateStr as string));
  };

  useEffect(() => {
    if (!loading) {
      const todayTasks = allTasks.filter(task => 
        // Include tasks with today's time slots
        (task.timeSlots?.some(slot => slot.startDate && isTodaySafe(slot.startDate)) ||
        // Also include tasks with no time slots or empty time slots
        !task.timeSlots || 
        task.timeSlots.length === 0 ||
        task.timeSlots.every(slot => !slot.startDate)) &&
        // And exclude archived tasks
        task.status !== 'archived'
      );
      setTasks(todayTasks);
    }
  }, [allTasks, loading]);

  useEffect(() => {
    if (!loading) {
      const todayEvents = allEvents.filter(event => 
        event.startTime && (isTodaySafe(event.startTime) || isTomorrowSafe(event.startTime))
      );
      setEvents(todayEvents);
    }
  }, [allEvents, loading]);

  useEffect(() => {
    if (!loading) {
      console.log(allSessions);
      const todaySessions = allSessions.filter(session => 
        session.scheduledFor && isTodaySafe(session.scheduledFor)
      );
      setSessions(todaySessions);
    }
  }, [allSessions, loading]);

  useEffect(() => {
    if (!loading) {
      const todayDeadlines = allTasks.filter(task => 
        task.deadline && 
        task.status !== "completed" &&
        (isTodaySafe(task.deadline) || isTomorrowSafe(task.deadline))
      );
      setDeadlines(todayDeadlines);
    }
  }, [allTasks, loading, setDeadlines]);

  useEffect(() => {
    if (!loading) {
      const todayReminders = allReminders.filter(reminder => 
        reminder.reminderTime && 
        (isTodaySafe(reminder.reminderTime) || isTomorrowSafe(reminder.reminderTime))
      );
      setReminders(todayReminders);
    }
  }, [allReminders, loading, setReminders]);

  // Initialize the quote only once when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setMotivationalQuote(motivationalQuotes[randomIndex]);
  }, []);

  const handleCreateTask = async (taskData: Task) => {
    try {
      if (editTask) {
        await updateTask(editTask.id, taskData);
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const { task: newTask } = await addTask(taskData);
        // Add the new task to the current tasks list if it's not archived
        if (newTask && newTask.status !== 'archived') {
          setTasks(prevTasks => [...prevTasks, newTask]);
        }
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      setCreateTaskOpen(false);
      setEditTask(null);
    } catch (error) {
      console.error("Error handling task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: editTask ? "Failed to update task" : "Failed to create task",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setCreateTaskOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      // Get the task we're "deleting"
      const taskToArchive = tasks.find(task => task.id === taskToDelete);
      
      if (taskToArchive) {
        // Instead of deleting, update the task to have 'archived' status
        // This removes it from the dashboard but keeps it in the "View All Tasks" dialog
        await updateTask(taskToDelete, {
          ...taskToArchive,
          status: 'archived' as 'todo' | 'in-progress' | 'completed' | 'archived',
          completion: 100
        });
        
        toast({
          title: "Success",
          description: "Task removed from dashboard",
        });
      } else {
        // If task not found, fall back to delete
        await deleteTask(taskToDelete);
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error handling task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove task",
      });
    }
    setTaskToDelete(null);
    setDeleteTaskOpen(false);
  };

  // Calculate completion metrics for all tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  
  // Calculate the average completion percentage across all tasks
  const totalCompletion = tasks.reduce((acc, task) => acc + (task.completion || 0), 0);
  const averageCompletion = totalTasks > 0 ? Math.round(totalCompletion / totalTasks) : 0;

  // Calculate task groups by completion range
  const notStartedTasks = tasks.filter((task) => (task.completion || 0) === 0).length;
  const inProgressTasks = tasks.filter((task) => (task.completion || 0) > 0 && (task.completion || 0) < 100).length;

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future depends on what you do today.",
    "Don't watch the clock; do what it does. Keep going.",
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it is done.",
    "Believe you can and you're halfway there.",
    "Dream big and dare to fail.",
    "What you get by achieving your goals is not as important as what you become by achieving them.",
    "Hardships often prepare ordinary people for an extraordinary destiny.",
    "The way to get started is to quit talking and begin doing.",
    "You don't have to be great to start, but you have to start to be great.",
    "You are never too old to set another goal or to dream a new dream.",
    "Don't wait for opportunity. Create it.",
    "A winner is a dreamer who never gives up.",
    "The best way to predict the future is to create it.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Don't stop when you're tired. Stop when you're done.",
    "Work hard in silence, let success make the noise.",
    "Do something today that your future self will thank you for.",
    "You are stronger than you think.",
    "Stay focused and never give up.",
    "Difficult roads often lead to beautiful destinations.",
    "Success doesn't just find you. You have to go out and get it.",
    "Failure is not the opposite of success; it's part of success.",
    "Hustle until you no longer have to introduce yourself.",
    "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love for what you are doing.",
    "You miss 100% of the shots you don't take.",
    "Small steps in the right direction can turn out to be the biggest step of your life.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Your only limit is you.",
    "Set your goals high, and don't stop till you get there.",
    "The man who moves a mountain begins by carrying away small stones.",
    "Start where you are. Use what you have. Do what you can.",
    "Action is the foundational key to all success.",
    "Every problem is a gift—without problems, we would not grow.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Opportunities don't happen, you create them.",
    "If you can dream it, you can do it.",
    "Don't limit your challenges. Challenge your limits.",
    "The difference between ordinary and extraordinary is that little extra.",
    "Be so good they can't ignore you.",
    "Success usually comes to those who are too busy to be looking for it.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Success is not how high you have climbed, but how you make a positive difference to the world.",
    "Go as far as you can see; when you get there, you'll be able to see further.",
    "I can and I will. Watch me.",
    "Make each day your masterpiece.",
    "Strength does not come from physical capacity. It comes from an indomitable will.",
    "Don't be afraid to give up the good to go for the great.",
    "Focus on being productive instead of busy.",
    "The struggle you're in today is developing the strength you need for tomorrow.",
    "Dream it. Wish it. Do it.",
    "You don't have to see the whole staircase, just take the first step.",
    "The only way to do great work is to love what you do.",
    "It's not whether you get knocked down, it's whether you get up.",
    "Fall seven times, stand up eight.",
    "Nothing is impossible. The word itself says 'I'm possible!'",
    "The best way to predict the future is to create it.",
    "Either you run the day or the day runs you.",
    "Believe you can and you're halfway there.",
    "You only fail when you stop trying.",
    "I'd rather be a failure at something I love than a success at something I hate.",
    "I am not a product of my circumstances. I am a product of my decisions.",
    "I'd rather regret the things I've done than regret the things I haven't done.",
    "The only way to do great work is to love what you do.",
  ];

  // Filter priority items
  const overdueTasks = allTasks.filter(
    (task) =>
      task.deadline &&
      isValidDate(task.deadline) &&
      isPastSafe(task.deadline) &&
      !isTodaySafe(task.deadline) &&
      task.status !== "completed"
  );

  const todayTasks = allTasks.filter(
    (task) =>
      task.deadline &&
      isValidDate(task.deadline) &&
      isTodaySafe(task.deadline) &&
      task.status !== "completed"
  );

  const getSessionEndTime = (scheduledFor: string, durationMinutes: number): Date | null => {
    try {
      if (!scheduledFor) return null;
      
      const startDate = new Date(scheduledFor);
      if (!isValid(startDate)) return null;
      
      // Add the duration in minutes to the start date
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      return endDate;
    } catch (error) {
      console.error("Error calculating session end time:", error);
      return null;
    }
  };

  const highPriorityItems = [
    ...tasks.filter(
      (task) =>
        task.deadline &&
        isValidDate(task.deadline) &&
        !isPastSafe(task.deadline) &&
        !isTodaySafe(task.deadline) &&
        task.status !== "completed" &&
        task.priority === "High"
    ),
    ...sessions.filter(
      (session) => {
        // Calculate the end time of the session
        const endTime = getSessionEndTime(session.scheduledFor, session.duration);
        
        return session.scheduledFor &&
          isValidDate(session.scheduledFor) &&
          endTime !== null &&
          !isPast(endTime) &&
          session.priority === "High" &&
          session.status !== "completed";
      }
    ),
    ...events.filter(
      (event) =>
        event.startTime &&
        event.endTime &&
        isValidDate(event.startTime) &&
        isValidDate(event.endTime) &&
        !isPastSafe(event.endTime) &&
        event.priority === "High"
    ),
  ];

  const formatDate = (dateStr: string | null | undefined) => {
    try {
      if (!dateStr) {
        return "No date";
      }
      
      const date = new Date(dateStr);
      if (!isValid(date)) {
        return "Invalid date";
      }
      
      return format(date, "PPp");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTime = (dateStr: string | null | undefined, formatString: string = "h:mm a") => {
    try {
      if (!dateStr) {
        return "No time";
      }
      
      const date = new Date(dateStr);
      if (!isValid(date)) {
        return "Invalid time";
      }
      
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await startSession(sessionId);
      toast({
        title: "Success",
        description: "Study session started",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start session",
      });
    }
  };

  const handlePostponeSession = async (data: {
    minutes?: number;
    hours?: number;
    days?: number;
  }) => {
    if (!sessionToPostpone) return;

    try {
      await postponeStudySession(sessionToPostpone, data);
      toast({
        title: "Success",
        description: "Study session postponed",
      });
      setPostponeSessionOpen(false);
      setSessionToPostpone(null);
    } catch (error) {
      console.error("Error postponing session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to postpone session",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete);
      toast({
        title: "Success",
        description: "Study session deleted",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete session",
      });
    }

    setSessionToDelete(null);
    setDeleteSessionOpen(false);
  };

  // Filter deadlines and reminders
  const filteredDeadlines = allTasks.filter(
    (task) =>
      task.deadline &&
      isValidDate(task.deadline) &&
      !isPastSafe(task.deadline) &&
      task.status !== "completed" &&
      (isTodaySafe(task.deadline) || isTomorrowSafe(task.deadline))
  );

  const filteredReminders = allReminders.filter(
    (reminder) =>
      reminder.reminderTime &&
      isValidDate(reminder.reminderTime) &&
      !isPastSafe(reminder.reminderTime) &&
      (isTodaySafe(reminder.reminderTime) || isTomorrowSafe(reminder.reminderTime))
  );

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

  const handleMarkDeadlineComplete = async (deadlineId: string) => {
    try {
      await markAsComplete(deadlineId);
      toast({
        title: "Success",
        description: "Deadline marked as complete",
      });
    } catch (error) {
      console.error("Error marking deadline complete:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark deadline as complete",
      });
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
      console.error("Error dismissing reminder:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to dismiss reminder",
      });
    }
  };

  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  
  // Function to update task completion in Firestore
  const updateTaskCompletion = async (taskId: string, newCompletion: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus: 'todo' | 'in-progress' | 'completed' = 
      newCompletion === 100 ? 'completed' : 
      newCompletion > 0 ? 'in-progress' : 'todo';
    
    const updatedTask = {
      ...task,
      completion: newCompletion,
      status: newStatus
    };
    
    await updateTask(taskId, updatedTask);
    
    // If completion is 100%, toast showing task is completed
    if (newCompletion === 100) {
      toast({
        title: "Task completed",
        description: `"${task.title}" has been marked as complete!`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-brand-primary/40">
        <h1 className="text-4xl font-bold text-brand-primary">Welcome back!</h1>
      </div>

      {/* Priority Items Card - Full Width */}
      <Card className="border-brand-primary/30 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-brand-primary">
            Priority Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Collapsible
            open={isOverdueOpen}
            onOpenChange={setIsOverdueOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-destructive/10 p-4 font-medium text-destructive hover:bg-destructive/15 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Overdue Deadlines ({overdueTasks.length})</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {overdueTasks.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`

                    flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm
                    ${
                      deadline.source === "google_calendar" ||
                      deadline.source === "google_tasks"
                        ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                        : ""
                    }

                    `}
                >
                  <div>
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(deadline.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                      onClick={() => handleMarkDeadlineComplete(deadline.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={isTodayOpen}
            onOpenChange={setIsTodayOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-primary/10 p-4 font-medium text-primary hover:bg-primary/15 transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Due Today ({todayTasks.length})</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {todayTasks.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`

                    flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm
                    ${
                      deadline.source === "google_calendar" ||
                      deadline.source === "google_tasks"
                        ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                        : ""
                    }

                    `}
                >
                  <div>
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(deadline.deadline)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                      onClick={() => handleMarkDeadlineComplete(deadline.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Badge variant="default">Today</Badge>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={isHighPriorityOpen}
            onOpenChange={setIsHighPriorityOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-secondary/10 p-4 font-medium text-secondary hover:bg-secondary/15 transition-colors">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>High Priority Items ({highPriorityItems.length})</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {highPriorityItems.map((item) => (
                <div
                  key={"id" in item ? item.id : ""}
                  className={`
                    flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm
                    ${
                      item.source === "google_calendar" ||
                      item.source === "google_tasks"
                        ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                        : ""
                    }
                    `}
                >
                  <div>
                    <p className="font-medium">
                      {"title" in item
                        ? item.title
                        : "subject" in item
                        ? item.subject
                        : item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {"deadline" in item && item.deadline
                        ? `Due: ${formatDate(item.deadline)}`
                        : "scheduledFor" in item && item.scheduledFor
                        ? `Scheduled: ${formatDate(item.scheduledFor)}`
                        : "startTime" in item && item.startTime
                        ? `Event: ${formatDate(item.startTime)}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="default">High Priority</Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Three Column Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tasks Card */}
        <Card className="border-brand-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Tasks
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditTask(null);
                setCreateTaskOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2 pb-4">
              <div className="w-full flex items-center space-x-2">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Task Progress</span>
                    <span>{averageCompletion}% Complete</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${averageCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-1">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base">{notStartedTasks}</span>
                  <span>Not Started</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base">{inProgressTasks}</span>
                  <span>In Progress</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base">{completedTasks}</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border p-4 transition-colors shadow-sm
                    ${
                      task.status === "completed"
                        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-900"
                        : "bg-white dark:bg-gray-800"
                    }
                    ${
                      task.source === "google_calendar" || task.source === "google_tasks"
                        ? "border-l-4 border-l-green-500 dark:border-l-green-400"
                        : ""
                    }
                    `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3
                        className={`font-medium ${
                          task.status === "completed"
                            ? "text-green-700 dark:text-green-300"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {task.timeSlots && task.timeSlots[0] && task.timeSlots[0].startDate
                          ? formatTime(task.timeSlots[0].startDate)
                          : "No time scheduled"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          task.priority === "High"
                            ? "destructive"
                            : task.priority === "Medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(task.completion === 100 || task.status === "completed") && (
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
                      )}
                    </div>
                  </div>
                  
                  {/* Completion Slider */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span>{(sliderValues[task.id] !== undefined ? sliderValues[task.id] : task.completion) || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValues[task.id] !== undefined ? sliderValues[task.id] : task.completion || 0}
                      onChange={(e) => {
                        const newCompletion = parseInt(e.target.value);
                        setSliderValues(prev => ({
                          ...prev,
                          [task.id]: newCompletion
                        }));
                      }}
                      onMouseUp={() => {
                        if (sliderValues[task.id] !== undefined) {
                          updateTaskCompletion(task.id, sliderValues[task.id]);
                        }
                      }}
                      onTouchEnd={() => {
                        if (sliderValues[task.id] !== undefined) {
                          updateTaskCompletion(task.id, sliderValues[task.id]);
                        }
                      }}
                      className="w-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(sliderValues[task.id] !== undefined ? sliderValues[task.id] : task.completion) || 0}%, #e5e7eb ${(sliderValues[task.id] !== undefined ? sliderValues[task.id] : task.completion) || 0}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setViewAllTasksOpen(true)}
              >
                View All Tasks
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Study Sessions Card */}
        <Card className="border-brand-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Study Sessions
            </CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSessionToEdit(null);
                setCreateSessionOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`relative rounded-lg border p-4 transition-all hover:shadow-md
                    ${
                      session.isAIRecommended
                        ? "border-l-4 border-l-purple-500 dark:border-l-purple-400 bg-white dark:bg-gray-800"
                        : "bg-white dark:bg-gray-800"
                    }`}
                >
                  {session.isAIRecommended && (
                    <div className="absolute -top-3 -right-2">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI Recommended
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{session.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.goal}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {session.scheduledFor ? formatTime(session.scheduledFor) : "No time"} (
                        {session.duration} min)
                      </div>
                      {session.isAIRecommended && (
                        <p className="text-sm italic text-muted-foreground mt-2">
                          {session.aiReason}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSessionToEdit(session);
                            setCreateSessionOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStartSession(session.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Session
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSessionToPostpone(session.id);
                            setPostponeSessionOpen(true);
                          }}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Postpone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          onClick={() => {
                            setSessionToDelete(session.id);
                            setDeleteSessionOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center text-muted-foreground py-6">
                  No study sessions scheduled for today
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events Timeline Card */}
        <Card className="border-brand-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Events Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EventsTimeline
              events={events}
              onEventClick={(event) => {
                setEventToEdit(event);
                setCreateEventOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Deadlines & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <h3 className="font-medium">{deadline.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(deadline.deadline)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkDeadlineComplete(deadline.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Badge
                    variant={
                      deadline.priority === "High"
                        ? "destructive"
                        : deadline.priority === "Medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {deadline.priority}
                  </Badge>
                </div>
              </div>
            ))}

            {filteredReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20"
              >
                <div>
                  <h3 className="font-medium">{reminder.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    At: {formatDate(reminder.reminderTime)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissReminder(reminder.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}

            {filteredDeadlines.length === 0 &&
              filteredReminders.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming deadlines or reminders
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Quote */}
      <div className="pt-6 text-center italic">
        <p className="text-xs leading-normal text-foreground dark:text-white">
          "{motivationalQuote}"
        </p>
      </div>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={handleCreateTask}
        initialTask={editTask}
        mode={editTask ? "edit" : "create"}
      />

      <ViewAllTasksDialog
        open={viewAllTasksOpen}
        onOpenChange={setViewAllTasksOpen}
      />

      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={handleCreateEvent}
        initialEvent={eventToEdit}
        mode={eventToEdit ? "edit" : "create"}
        tasks={tasks}
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

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={handleDeleteSession}
      />

      <PostponeSessionDialog
        open={postponeSessionOpen}
        onOpenChange={setPostponeSessionOpen}
        onConfirm={handlePostponeSession}
      />
    </div>
  );
}
