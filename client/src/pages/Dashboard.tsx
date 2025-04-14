import { useEffect, useState, useCallback } from "react";
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
  AlertTriangle,
  Clock,
  Bell,
  ChevronDown,
  Check,
  CircleX,
  CheckCircle,
  Plus,
  Trash2,
  ChevronRight,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ViewAllTasksDialog } from "@/components/ViewAllTasksDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { PostponeSessionDialog } from "@/components/PostponeSessionDialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { useData } from "@/contexts/DataProvider";
import { UnifiedItemDialog } from "@/components/UnifiedItemDialog";
import {
  SchedulableItem,
  ItemType,
  UnifiedTask,
  UnifiedEvent,
  UnifiedStudySession,
  convertFromUnified,
  convertToUnified
} from "@/types/unified";
import { Calendar } from "../components/calendar/Calendar";

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
    markTaskComplete: markAsComplete,
    deleteEvent,
    deleteReminder,
  } = useData();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [viewAllTasksOpen, setViewAllTasksOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);
  const [isTodayOpen, setIsTodayOpen] = useState(false);
  const [isHighPriorityOpen, setIsHighPriorityOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [postponeSessionOpen, setPostponeSessionOpen] = useState(false);
  const [sessionToPostpone, setSessionToPostpone] = useState<string | null>(
    null
  );
  const setDeadlines = useState<Task[]>([])[1];
  const setReminders = useState<Reminder[]>([])[1];
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
  // State for UnifiedItemDialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SchedulableItem | null>(null);
  const [initialItemType, setInitialItemType] = useState<ItemType>("task");

  // Store motivational quote in state so it doesn't change on re-renders
  const [motivationalQuote, setMotivationalQuote] = useState<string>('');

  // Helper functions for safe date handling
  const isValidDate = useCallback((dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return isValid(date);
  }, []);

  const isTodaySafe = useCallback((dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isToday(new Date(dateStr as string));
  }, [isValidDate]);

  const isTomorrowSafe = useCallback((dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isTomorrow(new Date(dateStr as string));
  }, [isValidDate]);

  const isPastSafe = useCallback((dateStr: string | null | undefined): boolean => {
    if (!isValidDate(dateStr)) return false;
    return isPast(new Date(dateStr as string));
  }, [isValidDate]);

  const [showCompleted, setShowCompleted] = useState(false);

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
        task.status !== 'archived' &&
        // Filter based on showCompleted state
        (showCompleted || task.status !== 'completed')
      );
      setTasks(todayTasks);
    }
  }, [allTasks, loading, showCompleted, isTodaySafe]);

  useEffect(() => {
    if (!loading) {
      const todayEvents = allEvents.filter(event => 
        event.startTime && (isTodaySafe(event.startTime) || isTomorrowSafe(event.startTime))
      );
      setEvents(todayEvents);
    }
  }, [allEvents, loading, isTodaySafe, isTomorrowSafe]);

  useEffect(() => {
    if (!loading) {
      console.log(allSessions);
      const todaySessions = allSessions.filter(session => 
        session.scheduledFor && isTodaySafe(session.scheduledFor)
      );
      setSessions(todaySessions);
    }
  }, [allSessions, loading, isTodaySafe]);

  useEffect(() => {
    if (!loading) {
      const todayDeadlines = allTasks.filter(task => 
        task.deadline && 
        task.status !== "completed" &&
        (isTodaySafe(task.deadline) || isTomorrowSafe(task.deadline))
      );
      setDeadlines(todayDeadlines);
    }
  }, [allTasks, loading, setDeadlines, isTodaySafe, isTomorrowSafe]);

  useEffect(() => {
    if (!loading) {
      const todayReminders = allReminders.filter(reminder => 
        reminder.reminderTime && 
        (isTodaySafe(reminder.reminderTime) || isTomorrowSafe(reminder.reminderTime))
      );
      setReminders(todayReminders);
    }
  }, [allReminders, loading, setReminders, isTodaySafe, isTomorrowSafe]);

  // Initialize the quote only once when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setMotivationalQuote(motivationalQuotes[randomIndex]);
  }, []);

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
    "You are never too old to set another goal or to dream a new dream.",
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

  const handleSaveItem = useCallback(async (item: SchedulableItem) => {
    try {
      const originalItem = convertFromUnified(item);
      
      switch (item.itemType) {
        case 'task': {
          const task = item as UnifiedTask;
          if (task.id) {
            await updateTask(task.id, originalItem);
            toast({ title: "Success", description: "Task updated successfully" });
          } else {
            await addTask(originalItem);
            toast({ title: "Success", description: "Task created successfully" });
          }
          break;
        }
        case 'event': {
          const event = item as UnifiedEvent;
          if (event.id) {
            await updateEvent(event.id, originalItem);
            toast({ title: "Success", description: "Event updated successfully" });
          } else {
            await addEvent(originalItem);
            toast({ title: "Success", description: "Event created successfully" });
          }
          break;
        }
        case 'session': {
          const session = item as UnifiedStudySession;
          if (session.id) {
            await updateSession(session.id, originalItem);
            toast({ title: "Success", description: "Study session updated successfully" });
          } else {
            await addSession(originalItem);
            toast({ title: "Success", description: "Study session created successfully" });
          }
          break;
        }
        // Reminder case if needed in the future
        // case 'reminder': { ... }
      }
      // Close dialog after saving
      setItemDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${item.itemType}`,
      });
    }
  }, [addTask, updateTask, addEvent, updateEvent, addSession, updateSession, toast]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      // First, find the item to determine its type
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
          // Add other cases as needed
        }
        // Close dialog after deleting
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
  }, [selectedItem, deleteTask, deleteEvent, deleteSession, toast]);

  const handleOpenCreateDialog = useCallback((type: ItemType) => {
    setSelectedItem(null);
    setInitialItemType(type);
    setItemDialogOpen(true);
  }, []);

  // Calculate completion metrics for all tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  
  // Calculate the average completion percentage across all tasks
  const totalCompletion = tasks.reduce((acc, task) => acc + (task.completion || 0), 0);
  const averageCompletion = totalTasks > 0 ? Math.round(totalCompletion / totalTasks) : 0;

  // Calculate task groups by completion range
  const notStartedTasks = tasks.filter((task) => (task.completion || 0) === 0).length;
  const inProgressTasks = tasks.filter((task) => (task.completion || 0) > 0 && (task.completion || 0) < 100).length;

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

  const handleEditItem = useCallback((item: Task | Event | StudySession) => {
    let itemType: ItemType;
    if ('deadline' in item) {
      itemType = 'task';
    } else if ('isAllDay' in item) {
      itemType = 'event';
    } else if ('scheduledFor' in item) {
      itemType = 'session';
    } else {
      console.warn("Unknown item type for editing:", item);
      // Default or throw error? For now, default to task.
      itemType = 'task'; 
    }
    const unifiedItem = convertToUnified(item, itemType);
    setSelectedItem(unifiedItem);
    setInitialItemType(itemType); // Set type in case conversion misses it
    setItemDialogOpen(true);
  }, []);

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
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      {/* Tasks Card */}
      <Card className="border-brand-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Tasks
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs"
              >
                {showCompleted ? <CircleX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  handleOpenCreateDialog('task');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                        onClick={() => handleEditItem(task)}
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
      </div>

      <Calendar 
        tasks={allTasks}
        events={allEvents}
        sessions={allSessions}
        reminders={allReminders}
        loading={loading}
        deleteReminder={deleteReminder}
        deleteTask={deleteTask}
        deleteEvent={deleteEvent}
        deleteSession={deleteSession}
        updateTask={updateTask}
        updateEvent={updateEvent}
        updateSession={updateSession}
      />

      {/* Motivational Quote */}
      <div className="pt-6 text-center italic">
        <p className="text-xs leading-normal text-foreground dark:text-white">
          "{motivationalQuote}"
        </p>
      </div>

      <ViewAllTasksDialog
        open={viewAllTasksOpen}
        onOpenChange={setViewAllTasksOpen}
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

      <PostponeSessionDialog
        open={postponeSessionOpen}
        onOpenChange={setPostponeSessionOpen}
        onConfirm={handlePostponeSession}
      />

      {/* Add Unified Item Dialog */}
      <UnifiedItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        initialItem={selectedItem}
        initialType={initialItemType}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        mode={selectedItem ? "edit" : "create"}
      />
    </div>
  );
}
