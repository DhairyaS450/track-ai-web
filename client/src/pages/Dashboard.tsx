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
import { CircularProgress } from "@/components/CircularProgress";
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
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (!loading) {
      const todayTasks = allTasks.filter(task => 
        task.timeSlots?.some(slot => isToday(new Date(slot.startDate)))
      );
      setTasks(todayTasks);
    }
  }, [allTasks, loading]);

  useEffect(() => {
    if (!loading) {
      const todayEvents = allEvents.filter(event => 
        isToday(new Date(event.startTime)) || isTomorrow(new Date(event.startTime))
      );
      setEvents(todayEvents);
    }
  }, [allEvents, loading]);

  useEffect(() => {
    if (!loading) {
      console.log(allSessions);
      const todaySessions = allSessions.filter(session => 
        isToday(new Date(session.scheduledFor))
      );
      setSessions(todaySessions);
    }
  }, [allSessions, loading]);

  useEffect(() => {
    if (!loading) {
      const todayDeadlines = allTasks.filter(task => 
        task.deadline && task.status !== "completed" &&
        (isToday(new Date(task.deadline)) || isTomorrow(new Date(task.deadline)))
      );
      setDeadlines(todayDeadlines);
    }
  }, [allTasks, loading, setDeadlines]);

  useEffect(() => {
    if (!loading) {
      const todayReminders = allReminders.filter(reminder => 
        isToday(new Date(reminder.reminderTime)) || isTomorrow(new Date(reminder.reminderTime))
      );
      setReminders(todayReminders);
    }
  }, [allReminders, loading, setReminders]);


  const handleCreateTask = async (taskData: Task) => {
    try {
      if (editTask) {
        await updateTask(editTask.id, taskData);
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

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

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

  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // const handleChatbotSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const form = e.currentTarget;
  //   const input = form.elements.namedItem("chatbot") as HTMLInputElement;

  //   toast({
  //     title: "Processing request",
  //     description: `Processing: "${input.value}"`,
  //   });

  //   input.value = "";
  // };
  
  // Filter priority items
  const overdueTasks = allTasks.filter(
    (task) =>
      task.deadline &&
      isValid(new Date(task.deadline)) &&
      isPast(new Date(task.deadline)) &&
      !isToday(new Date(task.deadline)) &&
      task.status !== "completed"
  );

  const todayTasks = allTasks.filter(
    (task) =>
      task.deadline &&
      isValid(new Date(task.deadline)) &&
      isToday(new Date(task.deadline)) &&
      task.status !== "completed"
  );

  const highPriorityItems = [
    ...tasks.filter(
      (task) =>
        task.deadline &&
        isValid(new Date(task.deadline)) &&
        !isPast(new Date(task.deadline)) &&
        !isToday(new Date(task.deadline)) &&
        task.status !== "completed" &&
        task.priority === "High"
    ),
    ...sessions.filter(
      (session) =>
        session.scheduledFor &&
        isValid(new Date(session.scheduledFor)) &&
        !isPast(new Date(session.scheduledFor + session.duration)) &&
        session.priority === "High" &&
        session.status !== "completed"
    ),
    ...events.filter(
      (event) =>
        event.startTime &&
        isValid(new Date(event.startTime)) &&
        !isPast(new Date(event.endTime)) &&
        event.priority === "High"
    ),
  ];

  const formatDate = (dateStr: string) => {
    try {
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
      !isPast(new Date(task.deadline)) &&
      task.status !== "completed" &&
      (isToday(new Date(task.deadline)) ||
        isTomorrow(new Date(task.deadline)))
  );

  const filteredReminders = allReminders.filter(
    (reminder) =>
      !isPast(new Date(reminder.reminderTime)) &&
      (isToday(new Date(reminder.reminderTime)) ||
        isTomorrow(new Date(reminder.reminderTime)))
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

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-brand-primary">
        <h1 className="text-4xl font-bold text-foreground">Welcome back!</h1>
      </div>

      {/* Priority Items Card - Full Width */}
      <Card className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border-brand-primary/20">
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
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-brand-primary/5 p-4 font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors">
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
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-brand-secondary/5 p-4 font-medium text-brand-secondary hover:bg-brand-secondary/10 transition-colors">
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
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-brand-primary/5 p-4 font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors">
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
      <div className="grid gap-6 md:grid-cols-3">
        {/* Tasks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Button variant="outline" size="icon" onClick={() => {
              setEditTask(null);
              setCreateTaskOpen(true);
            }}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <CircularProgress
                value={completedTasks}
                max={tasks.length || 1}
              />
              <span className="text-sm text-muted-foreground">
                {completedTasks} out of {tasks.length} tasks completed
              </span>
            </div>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors
                    ${
                      task.status === "completed"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                        : ""
                    }
                    ${
                      task.source === "google_calendar"
                        ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                        : ""
                    }
                    `}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedTasks);
                        if (e.target.checked) {
                          newSelected.add(task.id);
                        } else {
                          newSelected.delete(task.id);
                        }
                        setSelectedTasks(newSelected);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
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
                        {task.timeSlots[0] &&
                          format(
                            new Date(task.timeSlots[0].startDate),
                            "h:mm a"
                          )}
                      </p>
                    </div>
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
                    {selectedTasks.has(task.id) && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTask(task)}
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
                    )}
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
        <Card>
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
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                        : ""
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
                        {format(new Date(session.scheduledFor), "h:mm a")} (
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
        <EventsTimeline
          onEventClick={(event) => {
            setEventToEdit(event);
            setCreateEventOpen(true);
          }}
          events={events}
        />
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
                    Due: {format(new Date(deadline.deadline), "PPp")}
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
                    At: {format(new Date(reminder.reminderTime), "PPp")}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Daily Motivation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium italic text-muted-foreground">
            "{randomQuote}"
          </p>
        </CardContent>
      </Card>

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
