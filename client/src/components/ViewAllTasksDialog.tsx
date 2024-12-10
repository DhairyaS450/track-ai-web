import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Task } from "@/types";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface ViewAllTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

export function ViewAllTasksDialog({
  open,
  onOpenChange,
  tasks,
}: ViewAllTasksDialogProps) {
  const now = new Date();
  const futureTasks = tasks.filter(task => new Date(task.deadline) > now);
  const oldTasks = tasks.filter(task => new Date(task.deadline) <= now);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Tasks</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="future">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="future">Future Tasks</TabsTrigger>
            <TabsTrigger value="old">Old Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="future" className="space-y-4">
            {futureTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No future tasks</p>
            ) : (
              futureTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Due {format(new Date(task.deadline), "PPp")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {task.status}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium
                      ${task.priority === 'High' ? 'bg-red-100 text-red-700' : ''}
                      ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${task.priority === 'Low' ? 'bg-green-100 text-green-700' : ''}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="old" className="space-y-4">
            {oldTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No old tasks</p>
            ) : (
              oldTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Was due {format(new Date(task.deadline), "PPp")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {task.status}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium
                      ${task.priority === 'High' ? 'bg-red-100 text-red-700' : ''}
                      ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${task.priority === 'Low' ? 'bg-green-100 text-green-700' : ''}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}