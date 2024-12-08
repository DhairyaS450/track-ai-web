import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudySessions, addStudySession } from "@/api/sessions";
import { StudySession } from "@/types";
import { format } from "date-fns";
import {
  Play,
  Pause,
  Timer,
  BookOpen,
  Plus,
  Check,
  Calendar as CalendarIcon
} from "lucide-react";

export function StudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { sessions } = await getStudySessions();
    setSessions(sessions);
  };

  const startSession = (sessionId: string) => {
    setActiveSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setTimer(session.duration * 60);
    }
  };

  const pauseSession = () => {
    setActiveSession(null);
    setTimer(null);
  };

  useEffect(() => {
    let interval: number;
    if (activeSession && timer !== null && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, timer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Study Sessions</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{session.subject}</span>
                {session.status === 'completed' && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Goal</p>
                    <p className="text-sm text-muted-foreground">{session.goal}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {session.duration} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Scheduled for</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.scheduledFor), 'PPp')}
                    </p>
                  </div>
                </div>

                {session.status !== 'completed' && (
                  <div className="flex items-center justify-between border-t pt-4 mt-4">
                    {activeSession === session.id ? (
                      <>
                        <div className="text-lg font-semibold">
                          {timer !== null && formatTime(timer)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseSession()}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => startSession(session.id)}
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}