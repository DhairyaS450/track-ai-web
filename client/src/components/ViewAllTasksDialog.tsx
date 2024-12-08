import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Task } from "@/types";
import { format } from "date-fns";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Tasks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {tasks.map((task) => (
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
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}