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
import { useToast } from "@/hooks/useToast";
import { StudySession, Task, Event } from "@/types";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";

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
}: CreateStudySessionDialogProps) {
  const [topic, setTopic] = useState(initialSession?.subject || "");
  const [startTime, setStartTime] = useState(initialSession?.scheduledFor || "");
  const [duration, setDuration] = useState(initialSession?.duration || 60);
  const [goal, setGoal] = useState(initialSession?.goal || "");
  const [technique, setTechnique] = useState(initialSession?.technique || "pomodoro");
  const [breakInterval, setBreakInterval] = useState(initialSession?.breakInterval || Math.min(25, Math.max(5, Math.floor((initialSession?.duration || 60) * 0.8))));
  const [breakDuration, setBreakDuration] = useState(initialSession?.breakDuration || Math.min(5, Math.max(1, Math.floor((initialSession?.duration || 60) * 0.2))));
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
      setBreakInterval(initialSession.breakInterval || Math.min(25, Math.max(5, Math.floor((initialSession.duration || 60) * 0.8))));
      setBreakDuration(initialSession.breakDuration || Math.min(5, Math.max(1, Math.floor((initialSession.duration || 60) * 0.2))));
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

  // Initialize break intervals based on duration for new sessions
  useEffect(() => {
    if (!initialSession) {
      // For pomodoro, scale break intervals with duration
      if (technique === "pomodoro") {
        // For sessions shorter than 25 minutes, use scaled intervals
        if (duration < 25) {
          const scaledInterval = Math.max(5, Math.floor(duration * 0.8));
          const scaledBreak = Math.max(1, Math.floor(duration * 0.2));
          setBreakInterval(scaledInterval);
          setBreakDuration(scaledBreak);
        } else {
          // For standard or longer sessions, use default Pomodoro (25/5)
          setBreakInterval(25);
          setBreakDuration(5);
        }
      }
    }
  }, [duration, technique, initialSession]);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Subject is required",
      });
      return;
    }

    if (!startTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start time is required",
      });
      return;
    }

    try {
      // Preserve the original status when editing
      const sessionStatus = initialSession?.status || "scheduled";
      
      const sessionData = {
        ...(initialSession?.id ? { id: initialSession.id } : {}),
        subject: topic,
        scheduledFor: startTime,
        duration: duration || 60,
        goal: goal || '',
        technique: technique || 'pomodoro',
        breakInterval: breakInterval || 25,
        breakDuration: breakDuration || 5,
        materials: materials || '',
        priority: priority || 'Medium',
        isFlexible: isFlexible || false,
        reminders: reminders || [],
        linkedTaskIds: linkedTaskIds || [],
        linkedEventIds: linkedEventIds || [],
        // Preserve status and start time if this is an in-progress session
        status: sessionStatus,
        startTime: sessionStatus === "in-progress" ? initialSession?.startTime : undefined,
        completion: sessionStatus === "in-progress" ? initialSession?.completion || 0 : 0,
        notes: notes || '',
      };

      onSessionCreated(sessionData as StudySession);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save study session",
      });
      console.error(error)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {mode === "create" ? "Create Study Session" : "Edit Study Session"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="px-6 py-4 max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  onValueChange={(value) => setPriority(value as "High" | "Medium" | "Low")}
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
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full"
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
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="breakInterval">
                    Break Interval (minutes) 
                    <span className="text-xs ml-1 text-muted-foreground">
                      ~ {Math.round(duration * 0.8)}% of session
                    </span>
                  </Label>
                  <Input
                    id="breakInterval"
                    type="number"
                    min="1"
                    value={breakInterval}
                    onChange={(e) => setBreakInterval(parseInt(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="breakDuration">
                    Break Duration (minutes)
                    <span className="text-xs ml-1 text-muted-foreground">
                      ~ {Math.round(duration * 0.2)}% of session
                    </span>
                  </Label>
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
                className="w-full"
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
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {mode === "edit" ? "Save Changes" : "Create Session"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}