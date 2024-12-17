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
import { addStudySession, updateStudySession } from "@/api/sessions";
import { useToast } from "@/hooks/useToast";
import { StudySession, Task, Event } from "@/types";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
  const [topic, setTopic] = useState(initialSession?.subject || "");
  const [startTime, setStartTime] = useState(initialSession?.scheduledFor || "");
  const [duration, setDuration] = useState(initialSession?.duration || 60);
  const [goal, setGoal] = useState(initialSession?.goal || "");
  const [technique, setTechnique] = useState(initialSession?.technique || "pomodoro");
  const [breakInterval, setBreakInterval] = useState(initialSession?.breakInterval || 25);
  const [breakDuration, setBreakDuration] = useState(initialSession?.breakDuration || 5);
  const [materials, setMaterials] = useState(initialSession?.materials || "");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low" | undefined>(
    initialSession?.priority
  );
  const [isFlexible, setIsFlexible] = useState(initialSession?.isFlexible || false);
  const [reminders, setReminders] = useState(initialSession?.reminders || []);
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(
    initialSession?.linkedTaskIds || []
  );
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>(
    initialSession?.linkedEventIds || []
  );
  const [completion, setCompletion] = useState(initialSession?.completion || 0);
  const [notes, setNotes] = useState(initialSession?.notes || "");

  const { toast } = useToast();

  useEffect(() => {
    if (initialSession) {
      setTopic(initialSession.subject);
      setStartTime(initialSession.scheduledFor);
      setDuration(initialSession.duration);
      setGoal(initialSession.goal);
      setTechnique(initialSession.technique);
      setBreakInterval(initialSession.breakInterval || 25);
      setBreakDuration(initialSession.breakDuration || 5);
      setMaterials(initialSession.materials || "");
      setPriority(initialSession.priority);
      setIsFlexible(initialSession.isFlexible || false);
      setReminders(initialSession.reminders || []);
      setLinkedTaskIds(initialSession.linkedTaskIds || []);
      setLinkedEventIds(initialSession.linkedEventIds || []);
      setCompletion(initialSession.completion || 0);
      setNotes(initialSession.notes || "");
    }
  }, [initialSession]);

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
        status: "scheduled" as const,
        completion,
        notes,
      };

      let response;
      if (mode === "edit" && initialSession?.id) {
        response = await updateStudySession(initialSession.id, sessionData);
        toast({
          title: "Success",
          description: "Study session updated successfully",
        });
      } else {
        response = await addStudySession(sessionData);
        toast({
          title: "Success",
          description: "Study session created successfully",
        });
      }
      onSessionCreated(response.session);
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Study Session" : "Create Study Session"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "High" | "Medium" | "Low") =>
                  setPriority(value)
                }
              >
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you want to achieve?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="technique">Study Technique</Label>
              <Select value={technique} onValueChange={setTechnique}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                  <SelectItem value="deepwork">Deep Work</SelectItem>
                  <SelectItem value="spaced">Spaced Repetition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materials">Study Materials</Label>
              <Input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Enter study materials"
              />
            </div>
          </div>

          {technique === "pomodoro" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="breakInterval">Break Interval (minutes)</Label>
                <Input
                  id="breakInterval"
                  type="number"
                  min="1"
                  value={breakInterval}
                  onChange={(e) => setBreakInterval(parseInt(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                <Input
                  id="breakDuration"
                  type="number"
                  min="1"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Completion</Label>
              <span className="text-sm text-muted-foreground">{completion}%</span>
            </div>
            <Slider
              value={[completion]}
              onValueChange={(values) => setCompletion(values[0])}
              max={100}
              step={1}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this session"
              className="min-h-[100px]"
            />
          </div>
        </div>
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