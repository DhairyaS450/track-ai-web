import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudySessions, endStudySession } from "@/api/sessions";
import { CircularProgress } from "@/components/CircularProgress";
import { StudySession } from "@/types";
import { format } from "date-fns";
import {
  Play,
  Pause,
  Timer,
  BookOpen,
  Plus,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Clock,
  CalendarDays,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PostponeSessionDialog } from "@/components/PostponeSessionDialog";
import { CreateStudySessionDialog } from "@/components/CreateStudySessionDialog";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RescheduleSessionDialog } from "@/components/RescheduleSessionDialog";
import { addStudySession } from "@/api/sessions";

type SessionFilter = "all" | "ongoing" | "upcoming" | "completed";

export function StudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [postponeSessionOpen, setPostponeSessionOpen] = useState(false);
  const [sessionToPostpone, setSessionToPostpone] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [isActiveOpen, setIsActiveOpen] = useState(true);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [rescheduleSessionOpen, setRescheduleSessionOpen] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState<StudySession | null>(null);

  const isMobile = useMediaQuery("(max-width: 640px)");
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { sessions } = await getStudySessions();
    setSessions(sessions);

    // Set active session if there's one in progress
    const activeSession = sessions.find(s => s.status === 'in-progress');
    if (activeSession) {
      setActiveSession(activeSession);
      if (activeSession.endTime) {
        const remainingTime = Math.max(0, new Date(activeSession.endTime).getTime() - Date.now()) / 1000;
        setTimer(Math.round(remainingTime));
      }
    }
  };

  useEffect(() => {
    let interval: number;
    if (activeSession && timer !== null && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, timer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await endStudySession(sessionId, sessionNotes[sessionId]);
      await fetchSessions();
      setActiveSession(null);
      setTimer(null);
      toast({
        title: "Success",
        description: "Study session ended",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session",
      });
    }
  };

  const handleRescheduleSession = async (startTime: string, duration: number) => {
    if (!sessionToReschedule) return;

    try {
      const newSession: Omit<StudySession, "id"> = {
        ...sessionToReschedule,
        scheduledFor: startTime,
        duration: duration,
        status: 'scheduled',
        completion: 0,
        startTime: undefined,
        endTime: undefined
      };

      await addStudySession(newSession);
      await fetchSessions();
      toast({
        title: "Success",
        description: "Study session rescheduled",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reschedule session",
      });
    }
    setSessionToReschedule(null);
    setRescheduleSessionOpen(false);
  };

  const filteredSessions = sessions.filter(session => {
    switch (filter) {
      case "ongoing":
        return session.status === "in-progress";
      case "upcoming":
        return session.status === "scheduled";
      case "completed":
        return session.status === "completed";
      default:
        return true;
    }
  });

  const upcomingSessions = filteredSessions.filter(s => s.status === "scheduled");
  const completedSessions = filteredSessions.filter(s => s.status === "completed").reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Study Sessions</h1>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={(value: SessionFilter) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateSessionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-6">
          {/* Active Session Section */}
          {(filter === "all" || filter === "ongoing") && activeSession && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl font-semibold">
                  Your Active Study Session
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsActiveOpen(!isActiveOpen)}
                >
                  {isActiveOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <Collapsible open={isActiveOpen}>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{activeSession.subject}</h3>
                          <p className="text-sm text-muted-foreground">{activeSession.goal}</p>
                        </div>
                        <Badge
                          variant={
                            activeSession.priority === "High"
                              ? "destructive"
                              : activeSession.priority === "Medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {activeSession.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Started at {format(new Date(activeSession.scheduledFor!), "h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {timer !== null && formatTime(timer)}
                            </span>
                          </div>
                        </div>
                        <CircularProgress
                          value={activeSession.completion}
                          max={100}
                          size={40}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSessionToEdit(activeSession);
                            setCreateSessionOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTimer(null)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEndSession(activeSession.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          End Session
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Upcoming Sessions Section */}
          {(filter === "all" || filter === "upcoming") && upcomingSessions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Upcoming Study Sessions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
                >
                  {isUpcomingOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <Collapsible open={isUpcomingOpen}>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border",
                            session.priority === "High"
                              ? "bg-red-50/50 dark:bg-red-950/50"
                              : "bg-card"
                          )}
                        >
                          <div className="space-y-1">
                            <h3 className="font-medium">{session.subject}</h3>
                            <p className="text-sm text-muted-foreground">
                              {session.goal}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              {format(new Date(session.scheduledFor), "MMM d, h:mm a")}
                              <span className="text-muted-foreground">
                                ({session.duration} min)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                session.priority === "High"
                                  ? "destructive"
                                  : session.priority === "Medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {session.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSessionToEdit(session);
                                setCreateSessionOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSessionToPostpone(session.id);
                                setPostponeSessionOpen(true);
                              }}
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSessionToDelete(session.id);
                                setDeleteSessionOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Completed Sessions Section */}
          {(filter === "all" || filter === "completed") && completedSessions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Completed Study Sessions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                >
                  {isCompletedOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <Collapsible open={isCompletedOpen}>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      {completedSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="space-y-1">
                              <h3 className="font-medium">{session.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {session.goal}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Completed
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              {format(new Date(session.scheduledFor), "MMM d, h:mm a")}
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              {session.duration} minutes
                            </div>
                          </div>
                          <Textarea
                            placeholder="Add session notes..."
                            value={session.notes || ""}
                            onChange={(e) =>
                              setSessionNotes({
                                ...sessionNotes,
                                [session.id]: e.target.value,
                              })
                            }
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSessionToReschedule(session);
                              setRescheduleSessionOpen(true);
                            }}
                            className="mt-2"
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Reschedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {filteredSessions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No study sessions found
            </div>
          )}
        </div>
      </ScrollArea>

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSessionCreated={() => {
          fetchSessions();
          setCreateSessionOpen(false);
          setSessionToEdit(null);
        }}
        initialSession={sessionToEdit}
        mode={sessionToEdit ? "edit" : "create"}
        tasks={[]}
        events={[]}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={async () => {
          if (!sessionToDelete) return;
          try {
            await endStudySession(sessionToDelete);
            await fetchSessions();
            toast({
              title: "Success",
              description: "Study session deleted",
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to delete session",
            });
          }
          setSessionToDelete(null);
          setDeleteSessionOpen(false);
        }}
      />

      <PostponeSessionDialog
        open={postponeSessionOpen}
        onOpenChange={setPostponeSessionOpen}
        onConfirm={async (data) => {
          if (!sessionToPostpone) return;
          try {
            // Implement postpone functionality
            toast({
              title: "Success",
              description: "Study session postponed",
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to postpone session",
            });
          }
          setSessionToPostpone(null);
          setPostponeSessionOpen(false);
        }}
      />

      {sessionToReschedule && (
        <RescheduleSessionDialog
          open={rescheduleSessionOpen}
          onOpenChange={setRescheduleSessionOpen}
          onReschedule={handleRescheduleSession}
          session={sessionToReschedule}
        />
      )}
    </div>
  );
}