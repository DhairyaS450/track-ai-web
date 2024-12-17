import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CircularProgress } from "./CircularProgress";
import { format } from "date-fns";
import { Timer, Play, SkipForward, Pause } from "lucide-react";
import { Badge } from "./ui/badge";

interface StudySessionTimerProps {
  startTime: string;
  duration: number;
  breakInterval: number;
  breakDuration: number;
  onPhaseChange: (phase: 'study' | 'break') => void;
  onComplete: () => void;
  onPause: (progress: number) => void;
  onResume: () => void;
  initialProgress?: number;
}

export function StudySessionTimer({
  startTime,
  duration,
  breakInterval,
  breakDuration,
  onPhaseChange,
  onComplete,
  onPause,
  onResume,
  initialProgress = 0,
}: StudySessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isBreak, setIsBreak] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<Date>(new Date());
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const start = new Date(startTime);
    const totalDuration = duration * 60 * 1000; // Convert to milliseconds
    const now = new Date();
    const elapsed = now.getTime() - start.getTime();
    setTimeLeft(Math.max(0, totalDuration - elapsed));

    calculatePhase();
  }, [startTime, duration]);

  const calculatePhase = () => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = now.getTime() - start.getTime();
    const cycleTime = (breakInterval + breakDuration) * 60 * 1000;
    const currentCycle = Math.floor(elapsed / cycleTime);
    const timeInCycle = elapsed % cycleTime;
    const isInBreak = timeInCycle >= breakInterval * 60 * 1000;

    setIsBreak(isInBreak);
    setCurrentPhaseStartTime(new Date(start.getTime() + currentCycle * cycleTime));

    if (isInBreak) {
      const breakTimeLeft = cycleTime - timeInCycle;
      setPhaseTimeLeft(breakTimeLeft);
    } else {
      const studyTimeLeft = (breakInterval * 60 * 1000) - timeInCycle;
      setPhaseTimeLeft(studyTimeLeft);
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const totalDuration = duration * 60 * 1000;
      const elapsed = now.getTime() - start.getTime();
      const remaining = Math.max(0, totalDuration - elapsed);

      setTimeLeft(remaining);
      setProgress((elapsed / totalDuration) * 100);

      if (remaining === 0) {
        onComplete();
        clearInterval(timer);
        return;
      }

      calculatePhase();
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, startTime, duration, breakInterval, breakDuration]);

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(true);
    onPause(progress);
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume();
  };

  const skipPhase = () => {
    // Implement phase skipping logic
    setIsBreak(!isBreak);
    onPhaseChange(isBreak ? 'study' : 'break');
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Timer className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-medium">Time Remaining</h3>
            <p className="text-sm text-muted-foreground">
              {formatTimeLeft(timeLeft)}
            </p>
          </div>
        </div>
        <Badge
          variant={isBreak ? "secondary" : "default"}
          className="animate-pulse"
        >
          {isBreak ? "Break Time" : "Study Time"}
        </Badge>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          Current phase ends at:{" "}
          {format(
            new Date(currentPhaseStartTime.getTime() + phaseTimeLeft),
            "hh:mm a"
          )}
        </div>
        <CircularProgress value={progress} max={100} size={60} />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={skipPhase}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip {isBreak ? "Break" : "Study"} Phase
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={isPaused ? handleResume : handlePause}
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}