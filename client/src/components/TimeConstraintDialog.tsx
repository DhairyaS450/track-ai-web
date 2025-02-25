import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { TimeConstraint } from "@/types";

interface TimeConstraintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (constraint: Omit<TimeConstraint, 'id'>) => void;
  initialConstraint?: TimeConstraint;
}

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export function TimeConstraintDialog({
  open,
  onOpenChange,
  onSave,
  initialConstraint
}: TimeConstraintDialogProps) {
  const [constraint, setConstraint] = useState<Partial<TimeConstraint>>(
    initialConstraint || {
      title: "",
      priority: "Medium",
      daysOfWeek: [],
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: true
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(constraint as Omit<TimeConstraint, 'id'>);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialConstraint ? "Edit Time Constraint" : "Add Time Constraint"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={constraint.title}
              onChange={(e) =>
                setConstraint((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Sleep, Work, Class"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={constraint.priority}
              onValueChange={(value: 'High' | 'Medium' | 'Low') =>
                setConstraint((prev) => ({ ...prev, priority: value }))
              }
              className="flex space-x-4"
            >
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
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={constraint.daysOfWeek?.includes(day.value)}
                    onCheckedChange={(checked) => {
                      setConstraint((prev) => ({
                        ...prev,
                        daysOfWeek: checked
                          ? [...(prev.daysOfWeek || []), day.value]
                          : (prev.daysOfWeek || []).filter((d) => d !== day.value),
                      }));
                    }}
                  />
                  <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={constraint.startTime}
                onChange={(e) =>
                  setConstraint((prev) => ({ ...prev, startTime: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={constraint.endTime}
                onChange={(e) =>
                  setConstraint((prev) => ({ ...prev, endTime: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 