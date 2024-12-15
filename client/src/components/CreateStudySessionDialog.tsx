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
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { addStudySession, updateStudySession } from "@/api/sessions";
import { useToast } from "@/hooks/useToast";
import { StudySession, Task, Event } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, X } from "lucide-react";

interface CreateStudySessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: (session: StudySession) => void;
  initialSession?: StudySession | null;
  mode?: "create" | "edit";
  tasks?: Task[];
  events?: Event[];
}

export function CreateStudySessionDialog({
  open,
  onOpenChange,
  onSessionCreated,
  initialSession,
  mode = "create",
  tasks = [],
  events = [],
}: CreateStudySessionDialogProps) {
  const defaultTime = new Date().toISOString().slice(0, 16);

  const [topic, setTopic] = useState(initialSession?.subject || "");
  const [startTime, setStartTime] = useState(initialSession?.scheduledFor || defaultTime);
  const [endTime, setEndTime] = useState(initialSession?.scheduledFor || defaultTime + initialSession?.duration || defaultTime);
  const [isFlexible, setIsFlexible] = useState(initialSession?.isFlexible || false);
  const [duration, setDuration] = useState(initialSession?.duration || 60);
  const [goal, setGoal] = useState(initialSession?.goal || "");
  const [technique, setTechnique] = useState(initialSession?.technique || "pomodoro");
  const [breakInterval, setBreakInterval] = useState(initialSession?.breakInterval || 25);
  const [breakDuration, setBreakDuration] = useState(initialSession?.breakDuration || 5);
  const [materials, setMaterials] = useState(initialSession?.materials || "");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">(initialSession?.priority || "Medium");
  const [reminders, setReminders] = useState<Array<{ type: 'minutes' | 'hours' | 'days', amount: number }>>(
    initialSession?.reminders || []
  );
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(
    initialSession?.linkedTaskIds || []
  );
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>(
    initialSession?.linkedEventIds || []
  );

  const { toast } = useToast();

  useEffect(() => {
    if (initialSession && mode === "edit") {
      setTopic(initialSession.subject);
      setStartTime(initialSession.scheduledFor);
      setIsFlexible(initialSession.isFlexible || false);
      setDuration(initialSession.duration);
      setGoal(initialSession.goal);
      setTechnique(initialSession.technique);
      setBreakInterval(initialSession.breakInterval || 25);
      setBreakDuration(initialSession.breakDuration || 5);
      setMaterials(initialSession.materials || "");
      setPriority(initialSession.priority || "Medium");
      setReminders(initialSession.reminders || []);
      setLinkedTaskIds(initialSession.linkedTaskIds || []);
      setLinkedEventIds(initialSession.linkedEventIds || []);
    } else {
      setTopic("");
      setStartTime("");
      setIsFlexible(false);
      setDuration(60);
      setGoal("");
      setTechnique("pomodoro");
      setBreakInterval(25);
      setBreakDuration(5);
      setMaterials("");
      setPriority("Medium");
      setReminders([]);
      setLinkedTaskIds([]);
      setLinkedEventIds([]);
    }
  }, [initialSession, mode, open]);

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const durationInMinutes = Math.round((end - start) / 1000 / 60);
      setDuration(durationInMinutes);
    }
  }, [startTime, endTime]);

  const addReminder = () => {
    setReminders([...reminders, { type: 'minutes', amount: 15 }]);
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!startTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start time is required",
      });
      return;
    }

    try {
      const sessionData = {
        subject: topic,
        scheduledFor: startTime,
        duration,
        goal,
        technique,
        breakInterval,
        breakDuration,
        materials,
        priority,
        isFlexible,
        reminders,
        linkedTaskIds,
        linkedEventIds,
        status: 'scheduled' as const,
      };

      if (mode === "edit" && initialSession?.id) {
        const response = await updateStudySession(initialSession.id, sessionData);
        toast({
          title: "Success",
          description: "Study session updated successfully",
        });
        onSessionCreated(response.session);
      } else {
        const response = await addStudySession(sessionData);
        toast({
          title: "Success",
          description: "Study session created successfully",
        });
        onSessionCreated(response.session);
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save study session",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Study Session" : "Create Study Session"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic*</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter study topic"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time*</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time*</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFlexible"
                checked={isFlexible}
                onCheckedChange={setIsFlexible}
              />
              <Label htmlFor="isFlexible">Flexible timing</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal">Goals/Expected Outcomes</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want to achieve in this session?"
              />
            </div>

            <div className="grid gap-2">
              <Label>Study Technique</Label>
              <Select value={technique} onValueChange={setTechnique}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                  <SelectItem value="deepwork">Deep Work</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {technique === "pomodoro" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="breakInterval">Work Interval (minutes)</Label>
                  <Input
                    id="breakInterval"
                    type="number"
                    value={breakInterval}
                    onChange={(e) => setBreakInterval(parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                  <Input
                    id="breakDuration"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="materials">Materials/Resources</Label>
              <Input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Add links or references to study materials"
              />
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <RadioGroup
                value={priority}
                onValueChange={(value: "High" | "Medium" | "Low") =>
                  setPriority(value)
                }
              >
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
              <div className="flex items-center justify-between">
                <Label>Reminders</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminder}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
              <div className="space-y-2">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={reminder.amount}
                      onChange={(e) => {
                        const newReminders = [...reminders];
                        newReminders[index].amount = parseInt(e.target.value);
                        setReminders(newReminders);
                      }}
                      className="w-20"
                    />
                    <Select
                      value={reminder.type}
                      onValueChange={(value: 'minutes' | 'hours' | 'days') => {
                        const newReminders = [...reminders];
                        newReminders[index].type = value;
                        setReminders(newReminders);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReminder(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Link Tasks</Label>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={linkedTaskIds.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLinkedTaskIds([...linkedTaskIds, task.id]);
                        } else {
                          setLinkedTaskIds(
                            linkedTaskIds.filter((id) => id !== task.id)
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Link Events</Label>
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={linkedEventIds.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLinkedEventIds([...linkedEventIds, event.id]);
                        } else {
                          setLinkedEventIds(
                            linkedEventIds.filter((id) => id !== event.id)
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{event.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "Save Changes" : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}