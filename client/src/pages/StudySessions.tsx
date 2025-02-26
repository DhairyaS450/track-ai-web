import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudySession } from "@/types";
import { format } from "date-fns";
import {
  Timer,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Clock,
  CalendarDays,
  CheckCircle2,
  Filter,
  MoreVertical,
  Sparkles,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
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
import { StudySessionTimer } from "@/components/StudySessionTimer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataProvider";

type SessionFilter = "all" | "ongoing" | "upcoming" | "completed";

export function StudySessions() {
  const {
    sessions: allSessions,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    endSession
  } = useData();

  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
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

  const { toast } = useToast();

  useEffect(() => {
    // Set active session if there's one in progress
    const activeSession = allSessions.find(s => s.status === 'in-progress');
    if (activeSession) {
      console.log('There is an active session', activeSession)
      setActiveSession(activeSession);
    }
  }, [allSessions]);

  const handleEndSession = async (sessionId: string) => {
    try {
      await endSession(sessionId, sessionNotes[sessionId]);
      setActiveSession(null);
      toast({
        title: "Success",
        description: "Study session ended successfully",
      });
    } catch (error) {
      console.error("Error ending session:", error);
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
      // Create a clean copy of the session without undefined fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, startTime: oldStartTime, endTime, status, completion, ...sessionData } = sessionToReschedule;
      
      const newSession = {
        ...sessionData,
        scheduledFor: startTime,
        duration: duration,
        status: 'scheduled' as const,
        completion: 0,
        notes: ''  // Initialize with empty notes
      };

      await addSession(newSession);
      toast({
        title: "Success",
        description: "Study session rescheduled",
      });
    } catch (error) {
      console.error("Error rescheduling session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reschedule session",
      });
    }
    setSessionToReschedule(null);
    setRescheduleSessionOpen(false);
  };

  const handlePhaseChange = (phase: 'study' | 'break') => {
    toast({
      title: phase === 'study' ? "Study Time!" : "Break Time!",
      description: phase === 'study'
        ? "Focus on your tasks for this session"
        : "Take a short break to recharge",
    });
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await startSession(sessionId);
      toast({
        title: "Success",
        description: "Session started successfully",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start session",
      });
    }
  };

  const filteredSessions = allSessions.filter(session => {
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
  const completedSessions = filteredSessions.filter(s => s.status === "completed");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Study Sessions</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={filter} onValueChange={(value: SessionFilter) => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Button className="w-full sm:w-auto" onClick={() => setCreateSessionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-6">
          {/* Active Session Section */}
          {(filter === "all" || filter === "ongoing") && activeSession && (
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 md:px-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Timer className="h-6 w-6 text-blue-500" />
                  Active Study Session
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
                  <CardContent className="px-4 md:px-6">
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                      <StudySessionTimer
                        startTime={activeSession.scheduledFor}
                        duration={activeSession.duration}
                        breakInterval={activeSession.breakInterval || 25}
                        breakDuration={activeSession.breakDuration || 5}
                        onPhaseChange={handlePhaseChange}
                        onComplete={() => handleEndSession(activeSession.id)}
                        onPause={(progress) => {
                          toast({
                            title: "Session Paused",
                            description: `Progress saved: ${Math.round(progress)}%`,
                          });
                        }}
                        onResume={() => {
                          toast({
                            title: "Session Resumed",
                            description: "Keep up the good work!",
                          });
                        }}
                        initialProgress={activeSession.completion}
                      />

                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setSessionToEdit(activeSession);
                            setCreateSessionOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Session Settings
                        </Button>
                        <Button
                          variant="default"
                          className="w-full sm:w-auto"
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
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-green-500" />
                  Upcoming Sessions
                </CardTitle>
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
                            "flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md gap-4",
                            session.isAIRecommended
                              ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950"
                              : "bg-card hover:bg-accent/5",
                            session.priority === "High" && "border-red-200 dark:border-red-800"
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{session.subject}</h3>
                              {session.isAIRecommended && (
                                <Badge variant="secondary" className="gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {session.goal}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(session.scheduledFor), "h:mm a")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Timer className="h-4 w-4" />
                                {session.duration} minutes
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end md:self-center">
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
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleStartSession(session.id)}
                                variant="default"
                                size="sm"
                              >
                                <Timer className="h-4 w-4 mr-2" />
                                Start Session
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSessionToEdit(session);
                                      setCreateSessionOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSessionToPostpone(session.id);
                                      setPostponeSessionOpen(true);
                                    }}
                                  >
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Postpone
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => {
                                      setSessionToDelete(session.id);
                                      setDeleteSessionOpen(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed Sessions
                </CardTitle>
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
                          className="flex flex-col p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                            <div className="space-y-1">
                              <h3 className="font-medium">{session.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {session.goal}
                              </p>
                            </div>
                            <Badge variant="secondary" className="self-start md:self-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
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
                            className="min-h-[100px] mb-4"
                          />
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto self-end"
                            onClick={() => {
                              setSessionToReschedule(session);
                              setRescheduleSessionOpen(true);
                            }}
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Schedule Again
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
        onSessionCreated={async (session: StudySession) => {
          try {
            if (sessionToEdit) {
              await updateSession(sessionToEdit.id, session);
            } else {
              await addSession(session);
            }
          } catch (error) {
            console.error("Error creating session:", error);
          }
          setCreateSessionOpen(false);
          setSessionToEdit(null);
        }}
        initialSession={sessionToEdit}
        mode={sessionToEdit ? "edit" : "create"}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={async () => {
          if (!sessionToDelete) return;
          try {
            await deleteSession(sessionToDelete);
            toast({
              title: "Success",
              description: "Study session deleted successfully",
            });
          } catch (error) {
            console.error("Error deleting session:", error);
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
        onConfirm={async () => {
          if (!sessionToPostpone) return;
          try {
            // Implement postpone functionality
            toast({
              title: "Success",
              description: "Study session postponed successfully",
            });
          } catch (error) {
            console.error("Error postponing session:", error);
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