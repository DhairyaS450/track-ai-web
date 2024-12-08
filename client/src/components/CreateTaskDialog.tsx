import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { addTask, updateTask } from "@/api/tasks";
import { useToast } from "@/hooks/useToast";
import { Task } from "@/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  initialTask?: Task;
  mode?: 'create' | 'edit';
}

type Priority = 'High' | 'Medium' | 'Low';

export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
  initialTask,
  mode = 'create'
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [priority, setPriority] = useState<Priority>(initialTask?.priority || "Medium");
  const [startDate, setStartDate] = useState(initialTask?.startDate ? new Date(initialTask.startDate).toISOString().slice(0, 16) : "");
  const [endDate, setEndDate] = useState(initialTask?.endDate ? new Date(initialTask.endDate).toISOString().slice(0, 16) : "");
  const [recurrence, setRecurrence] = useState("none");
  const [resources, setResources] = useState("");
  const [completion, setCompletion] = useState([initialTask?.status === 'completed' ? 100 : initialTask?.status === 'in-progress' ? 50 : 0]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const completionStatus = completion[0] === 100
        ? "completed" as const
        : completion[0] > 0
        ? "in-progress" as const
        : "todo" as const;

      const taskData = {
        title,
        description,
        priority,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: completionStatus,
        subject: "General",
      };

      let response;
      if (mode === 'create') {
        response = await addTask(taskData);
      } else {
        response = await updateTask(initialTask!.id, taskData);
      }

      toast({
        title: "Success",
        description: `Task ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });
      
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStartDate("");
      setEndDate("");
      setRecurrence("none");
      setResources("");
      setCompletion([0]);
      
      onOpenChange(false);
      onTaskCreated(response.task);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} task`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new task to your list'
              : 'Update the details of your task'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date/Time</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date/Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resources">Linked Resources</Label>
            <Input
              id="resources"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              placeholder="Enter resource URLs"
            />
          </div>
          <div className="space-y-2">
            <Label>Completion Status ({completion[0]}%)</Label>
            <Slider
              value={completion}
              onValueChange={setCompletion}
              max={100}
              step={1}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}