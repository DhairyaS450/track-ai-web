import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { addTask, updateTask } from "@/api/tasks";
import { useToast } from "@/hooks/useToast";
import { Task, TimeSlot } from "@/types";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";

type Priority = "High" | "Medium" | "Low";
type Recurrence = "daily" | "weekly" | "monthly";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  initialTask?: Task | null;
  mode?: "create" | "edit";
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
  initialTask,
  mode = "create",
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [priority, setPriority] = useState<Priority>(
    initialTask?.priority || "Medium"
  );
  const [deadline, setDeadline] = useState(
    initialTask?.deadline
      ? new Date(initialTask.deadline).toISOString().slice(0, 16)
      : ""
  );
  const [subject, setSubject] = useState(initialTask?.subject || "");
  const [resources, setResources] = useState(initialTask?.resources || "");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    initialTask?.timeSlots || [{ startDate: "", endDate: "" }]
  );
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(
    initialTask?.recurrence
  );
  const [completion, setCompletion] = useState(initialTask?.completion || 0);

  const { toast } = useToast();

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setPriority(initialTask.priority);
      setDeadline(new Date(initialTask.deadline).toISOString().slice(0, 16));
      setSubject(initialTask.subject || "");
      setResources(initialTask.resources || "");
      setTimeSlots(initialTask.timeSlots || [{ startDate: "", endDate: "" }]);
      setRecurrence(initialTask.recurrence);
      setCompletion(initialTask.completion || 0);
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDeadline("");
      setSubject("");
      setResources("");
      setTimeSlots([{ startDate: "", endDate: "" }]);
      setRecurrence(undefined);
      setCompletion(0);
    }
  }, [initialTask]);

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startDate: "", endDate: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setTimeSlots(newTimeSlots);
  };

  const handleSubmit = async () => {
    try {
      var status_field : 'completed' | 'in-progress' | 'todo';
      if (completion == 100) {
        status_field = 'completed'
      } else if (completion < 100 && completion > 0) {
        status_field = 'in-progress'
      } else {
        status_field = 'todo'
      } 
      const taskData = {
        title,
        description,
        priority,
        deadline,
        subject,
        resources,
        status: status_field,
        timeSlots,
        recurrence,
        completion,
      };

      if (mode === "edit" && initialTask?.id) {
        await updateTask(initialTask.id, taskData);
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

      onTaskCreated(taskData as Task);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save task",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <RadioGroup value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="High" id="priority-high" />
                    <Label htmlFor="priority-high">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Medium" id="priority-medium" />
                    <Label htmlFor="priority-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Low" id="priority-low" />
                    <Label htmlFor="priority-low">Low</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Time Slots</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Slot
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <Label>Start Time</Label>
                <Label>End Time</Label>
              </div>

              {timeSlots.map((slot, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4">
                  <Input
                    type="datetime-local"
                    value={slot.startDate}
                    onChange={(e) => updateTimeSlot(index, "startDate", e.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    value={slot.endDate}
                    onChange={(e) => updateTimeSlot(index, "endDate", e.target.value)}
                  />
                  {timeSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label>Recurrence</Label>
              <Select value={recurrence} onValueChange={(value: Recurrence) => setRecurrence(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resources">Resources</Label>
              <Input
                id="resources"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder="Enter resource links"
              />
            </div>
          </div>

          <div className="grid gap-2">
              <Label>Completion ({completion}%)</Label>
              <Slider
                value={[completion]}
                onValueChange={(values) => {
                  const newValue = values[0];
                  setCompletion(newValue);
                }}
                max={100}
                step={1}
              />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}