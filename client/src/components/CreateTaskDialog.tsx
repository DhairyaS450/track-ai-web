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
import { useToast } from "@/hooks/useToast";
import { Task, TimeSlot } from "@/types";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

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
  const now = new Date();
  now.setHours(23, 59, 0, 0);
  const defaultDeadline = new Date().toLocaleString("sv-SE").slice(0, 16); // Format: YYYY-MM-DDThh:mm
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium" as Priority,
    deadline: defaultDeadline,
    subject: "",
    resources: "",
    timeSlots: [{ startDate: "", endDate: "" }] as TimeSlot[],
    recurrence: undefined as Recurrence | undefined,
    completion: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title,
        description: initialTask.description,
        priority: initialTask.priority,
        deadline: initialTask.deadline,
        subject: initialTask.subject || "",
        resources: initialTask.resources || "",
        timeSlots: initialTask.timeSlots || [{ startDate: "", endDate: "" }],
        recurrence: initialTask.recurrence,
        completion: initialTask.completion || 0,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        deadline: defaultDeadline,
        subject: "",
        resources: "",
        timeSlots: [{ startDate: "", endDate: "" }],
        recurrence: undefined,
        completion: 0,
      });
    }
  }, [initialTask, defaultDeadline]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addTimeSlot = () => {
    updateFormData({
      timeSlots: [...formData.timeSlots, { startDate: "", endDate: "" }],
    });
  };

  const removeTimeSlot = (index: number) => {
    updateFormData({
      timeSlots: formData.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    updateFormData({ timeSlots: newTimeSlots });
  };

  const handleSubmit = async () => {
    try {
      const status: 'completed' | 'in-progress' | 'todo' = 
        formData.completion === 100 ? 'completed' : 
        formData.completion > 0 ? 'in-progress' : 'todo';

      const taskData = {
        ...formData,
        status,
      };

      // Just pass the data to the parent handler
      onTaskCreated(taskData as Task);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save task",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[600px]", isMobile && "p-4")}>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <RadioGroup 
                value={formData.priority} 
                onValueChange={(value: Priority) => updateFormData({ priority: value })}
              >
                <div className={cn("flex gap-4", isMobile && "flex-col")}>
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
                value={formData.deadline}
                onChange={(e) => updateFormData({ deadline: e.target.value })}
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

              {isMobile ? (
                <>
                  <div className="grid grid-cols-1 gap-4 mb-2">
                    {formData.timeSlots.map((slot, index) => (
                      <div key={index} className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={slot.startDate}
                          onChange={(e) => updateTimeSlot(index, "startDate", e.target.value)}
                        />
                        <Label>End Time</Label>
                        <div className="flex gap-2">
                          <Input
                            type="datetime-local"
                            value={slot.endDate}
                            onChange={(e) => updateTimeSlot(index, "endDate", e.target.value)}
                          />
                          {formData.timeSlots.length > 1 && (
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
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Label>Start Time</Label>
                    <Label>End Time</Label>
                  </div>

                  {formData.timeSlots.map((slot, index) => (
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
                      {formData.timeSlots.length > 1 && (
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
                </>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Recurrence</Label>
              <Select 
                value={formData.recurrence} 
                onValueChange={(value: Recurrence) => updateFormData({ recurrence: value })}
              >
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
                value={formData.subject}
                onChange={(e) => updateFormData({ subject: e.target.value })}
                placeholder="Enter subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resources">Resources</Label>
              <Input
                id="resources"
                value={formData.resources}
                onChange={(e) => updateFormData({ resources: e.target.value })}
                placeholder="Enter resource links"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Completion</Label>
                <span className="text-sm text-muted-foreground">{formData.completion}%</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[formData.completion]}
                  onValueChange={(values) => updateFormData({ completion: values[0] })}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
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