import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTasks, deleteTask, getTodayTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { Task, StudySession } from "@/types";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { ViewAllTasksDialog } from "@/components/ViewAllTasksDialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [viewAllTasksOpen, setViewAllTasksOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    const [currentTasks, allTasksData, sessionsData] = await Promise.all([
      getTodayTasks(),
      getTasks(true),
      getStudySessions(),
    ]);
    setTasks(currentTasks.tasks);
    setAllTasks(allTasksData.tasks);
    setSessions(sessionsData.sessions);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>

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
                        Start Time: {format(new Date(task.timeSlots[0].startDate), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium
                        ${task.priority === 'High' ? 'bg-red-100 text-red-700' : ''}
                        ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${task.priority === 'Low' ? 'bg-green-100 text-green-700' : ''}`}
                    >
                      {task.priority}
                    </span>
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
                      {format(new Date(session.scheduledFor), "PPp")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
      />

      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}