import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTasks, deleteTask, getTodayTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { getEvents } from "@/api/events";
import { Task, StudySession, Event } from "@/types";
import { format, isPast, isToday, isValid } from "date-fns";
import { Plus, Edit, Trash2, ChevronRight, AlertTriangle, Clock, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { ViewAllTasksDialog } from "@/components/ViewAllTasksDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EventsTimeline } from "@/components/EventsTimeline";
import { CreateEventDialog } from "@/components/CreateEventDialog";

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [viewAllTasksOpen, setViewAllTasksOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isTodayOpen, setIsTodayOpen] = useState(true);
  const [isHighPriorityOpen, setIsHighPriorityOpen] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    const [currentTasks, allTasksData, sessionsData, eventsData] = await Promise.all([
      getTodayTasks(),
      getTasks(true),
      getStudySessions(),
      getEvents(),
    ]);
    setTasks(currentTasks.tasks);
    setAllTasks(allTasksData.tasks);
    setSessions(sessionsData.sessions);
    setEvents(eventsData.events);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      await fetchData();
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

  const handleCreateTask = () => {
    setEditTask(null);
    setCreateTaskOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setCreateTaskOpen(true);
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future depends on what you do today.",
    "Don't watch the clock; do what it does. Keep going.",
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const handleChatbotSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('chatbot') as HTMLInputElement;

    toast({
      title: "Processing request",
      description: `Processing: "${input.value}"`,
    });

    input.value = '';
  };

  // Filter priority items
  const overdueTasks = allTasks.filter(task =>
    task.deadline &&
    isValid(new Date(task.deadline)) &&
    isPast(new Date(task.deadline)) &&
    !isToday(new Date(task.deadline)) &&
    task.status !== 'completed'
  );

  const todayTasks = allTasks.filter(task =>
    task.deadline &&
    isValid(new Date(task.deadline)) &&
    isToday(new Date(task.deadline)) &&
    task.status !== 'completed'
  );

  const highPriorityItems = [
    ...allTasks.filter(task =>
      task.deadline &&
      isValid(new Date(task.deadline)) &&
      !isPast(new Date(task.deadline)) &&
      !isToday(new Date(task.deadline)) &&
      task.status !== 'completed' &&
      task.priority === 'High'
    ),
    ...sessions.filter(session =>
      session.scheduledFor &&
      isValid(new Date(session.scheduledFor)) &&
      session.priority === 'High' &&
      session.status !== 'completed'
    ),
    ...events.filter(event =>
      event.startTime &&
      isValid(new Date(event.startTime)) &&
      event.priority === 'High'
    )
  ];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return format(date, 'PPp');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Priority Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueTasks.length > 0 && (
            <Collapsible open={isOverdueOpen} onOpenChange={setIsOverdueOpen} className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Overdue Tasks ({overdueTasks.length})
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOverdueOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(task.deadline)}
                      </p>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {todayTasks.length > 0 && (
            <Collapsible open={isTodayOpen} onOpenChange={setIsTodayOpen} className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Due Today ({todayTasks.length})
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isTodayOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(task.deadline)}
                      </p>
                    </div>
                    <Badge variant="secondary">Today</Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {highPriorityItems.length > 0 && (
            <Collapsible open={isHighPriorityOpen} onOpenChange={setIsHighPriorityOpen}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  High Priority Items ({highPriorityItems.length})
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isHighPriorityOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {highPriorityItems.map((item) => (
                  <div
                    key={'id' in item ? item.id : ''}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {'title' in item ? item.title : 'subject' in item ? item.subject : item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {'deadline' in item && item.deadline
                          ? `Due: ${formatDate(item.deadline)}`
                          : 'scheduledFor' in item && item.scheduledFor
                          ? `Scheduled: ${formatDate(item.scheduledFor)}`
                          : 'startTime' in item && item.startTime
                          ? `Event: ${formatDate(item.startTime)}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant="default">High Priority</Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {overdueTasks.length === 0 && todayTasks.length === 0 && highPriorityItems.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No priority items to display
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Button variant="outline" size="icon" onClick={handleCreateTask}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <CircularProgress value={completedTasks} max={tasks.length || 1} />
              <span className="text-sm text-muted-foreground">
                {completedTasks} out of {tasks.length} tasks completed
              </span>
            </div>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors
                    ${task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' : ''}`}
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
                      <h3 className={`font-medium ${task.status === 'completed' ? 'text-green-700 dark:text-green-300' : ''}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {task.timeSlots[0] && format(new Date(task.timeSlots[0].startDate), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        task.priority === 'High'
                          ? 'destructive'
                          : task.priority === 'Medium'
                          ? 'default'
                          : 'secondary'
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(session.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedSessions);
                      if (e.target.checked) {
                        newSelected.add(session.id);
                      } else {
                        newSelected.delete(session.id);
                      }
                      setSelectedSessions(newSelected);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <h3 className="font-medium">{session.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {session.goal}
                    </p>
                    <div className="mt-2 text-sm">
                      {formatDate(session.scheduledFor)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <EventsTimeline
          events={events}
          onEventClick={(event) => {
            setEventToEdit(event);
            setCreateEventOpen(true);
          }}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium italic text-muted-foreground">
              "{randomQuote}"
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleChatbotSubmit} className="flex space-x-2">
            <Input
              name="chatbot"
              className="flex-1"
              placeholder="Quickly type what you want to do here..."
            />
            <Button type="submit">Send</Button>
          </form>
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={(task) => {
          fetchData();
          setEditTask(null);
          setCreateTaskOpen(false);
        }}
        initialTask={editTask}
        mode={editTask ? 'edit' : 'create'}
      />

      <ViewAllTasksDialog
        open={viewAllTasksOpen}
        onOpenChange={setViewAllTasksOpen}
        tasks={allTasks}
        onTasksChange={fetchData}
      />

      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={() => {
          fetchData();
          setCreateEventOpen(false);
          setEventToEdit(null);
        }}
        initialEvent={eventToEdit}
        mode={eventToEdit ? 'edit' : 'create'}
        tasks={tasks}
      />
    </div>
  );
}