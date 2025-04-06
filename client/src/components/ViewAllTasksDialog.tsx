import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Task } from "@/types";
import { format, isToday, isThisWeek, isThisMonth, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TaskFilters } from "./TaskFilters";
import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { useData } from "@/contexts/DataProvider";
import { useToast } from "@/hooks/useToast";
import { convertToUnified } from "@/types/unified";
import { UnifiedItemDialog } from "./UnifiedItemDialog";
import { useItemManager } from "@/hooks/useItemManager";

interface ViewAllTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewAllTasksDialog({
  open,
  onOpenChange,
}: ViewAllTasksDialogProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleSaveItem } = useItemManager();
  
  const { tasks, deleteTask } = useData();

  const filterTasks = (tasksToFilter: Task[]) => {
    return tasksToFilter.filter((task) => {
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      if (filters.deadline) {
        const deadlineDate = new Date(task.deadline);
        switch (filters.deadline) {
          case 'today':
            if (!isToday(deadlineDate)) return false;
            break;
          case 'week':
            if (!isThisWeek(deadlineDate)) return false;
            break;
          case 'month':
            if (!isThisMonth(deadlineDate)) return false;
            break;
          case 'overdue':
            if (!isPast(deadlineDate) || isToday(deadlineDate)) return false;
            break;
        }
      }

      if (filters.recurrence && task.recurrence !== filters.recurrence) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const handleEditTask = (task: Task) => {
    // Convert the task to unified format
    const unifiedTask = convertToUnified(task, 'task');
    setSelectedItem(unifiedTask);
    setItemDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      setTaskToDelete(null);
      setDeleteTaskOpen(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task",
      });
    }
  };

  const handleSaveItemComplete = async (item: any) => {
    try {
      await handleSaveItem(item);
      setItemDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const futureTasks = filterTasks(
    tasks.filter((task) => {
      const status = task.status as string;
      return status !== "completed" && status !== "archived";
    })
  );
  
  const oldTasks = filterTasks(
    tasks.filter((task) => {
      const status = task.status as string;
      return status === "completed" || status === "archived";
    })
  );

  const resetFilters = () => {
    setFilters({});
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      key={task.id}
      className={`flex items-center justify-between rounded-lg border p-4
        ${
          task.source === "google_calendar" || task.source === "google_tasks"
            ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
            : ""
        }
        ${
          (task.status as string) === "archived" 
            ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            : ""
        }
        `}
    >
      <div>
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm text-muted-foreground">
          {(task.status as string) === 'completed' || (task.status as string) === 'archived' ? 'Completed' : `Due ${format(new Date(task.deadline), "PPp")}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Status: {(task.status as string) === 'archived' ? 'completed' : task.status}
        </p>
        {task.recurrence && (
          <p className="text-sm text-muted-foreground">
            Repeats: {task.recurrence}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium
            ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : ''}
            ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : ''}
            ${task.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}`}
        >
          {task.priority}
        </span>
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
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>All Tasks</DialogTitle>
          <TaskFilters
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
          />
        </DialogHeader>
        <Tabs defaultValue="future" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="future">Not Completed</TabsTrigger>
            <TabsTrigger value="old">Completed</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="future" className="space-y-4">
              {futureTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {Object.keys(filters).length > 0
                    ? "No tasks match the selected filters"
                    : "No future tasks"}
                </p>
              ) : (
                futureTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            <TabsContent value="old" className="space-y-4">
              {oldTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {Object.keys(filters).length > 0
                    ? "No tasks match the selected filters"
                    : "No old tasks"}
                </p>
              ) : (
                oldTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <UnifiedItemDialog
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
          initialItem={selectedItem}
          initialType="task"
          onSave={handleSaveItemComplete}
          mode="edit"
        />

        <DeleteTaskDialog
          open={deleteTaskOpen}
          onOpenChange={setDeleteTaskOpen}
          onConfirm={handleDeleteTask}
        />
      </DialogContent>
    </Dialog>
  );
}