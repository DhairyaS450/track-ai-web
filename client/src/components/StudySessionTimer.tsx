/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CircularProgress } from "./CircularProgress";
import { format } from "date-fns";
import { Timer, Play, SkipForward, Pause, MessageSquare } from "lucide-react";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const breakSuggestions = [
  "Stretch for 5 minutes to reduce muscle tension",
  "Drink water and take deep breaths - stay hydrated!",
  "Did you know? Short breaks improve focus and productivity!",
  "Stand up and walk around to boost circulation",
  "Look at something 20 feet away for 20 seconds to reduce eye strain",
  "Do some quick desk exercises to stay energized",
  "Practice mindful breathing to reduce stress",
  "Give your eyes a rest from the screen",
  "Try some shoulder and neck stretches",
  "Hydrate and have a healthy snack if needed",
];

interface StudySessionTimerProps {
  startTime: string;
  duration: number;
  breakInterval: number;
  breakDuration: number;
  onPhaseChange: (phase: "study" | "break") => void;
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
  const [isBreak, setIsBreak] = useState(() => {
    const savedPhase = localStorage.getItem("currentPhase");
    return savedPhase === "break";
  });
  const [isPaused, setIsPaused] = useState(false);
  const [phaseStartTime, setPhaseStartTime] = useState<Date>(new Date());
  const [phaseEndTime, setPhaseEndTime] = useState<Date>(new Date());
  const [progress, setProgress] = useState(initialProgress);
  const [currentBreakSuggestion, setCurrentBreakSuggestion] = useState("");
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const calculatePhaseEndTime = useCallback(
    (startDate: Date, isBreakPhase: boolean) => {
      const phaseLength = isBreakPhase ? breakDuration : breakInterval;
      return new Date(startDate.getTime() + phaseLength * 60000);
    },
    [breakDuration, breakInterval]
  );

  const loadSavedState = useCallback(() => {
    const savedTimeLeft = localStorage.getItem("timeLeft");
    const savedPhaseStartTime = localStorage.getItem("phaseStartTime");
    const savedPhaseEndTime = localStorage.getItem("phaseEndTime");
    const savedProgress = localStorage.getItem("progress");

    if (savedTimeLeft && savedPhaseStartTime && savedPhaseEndTime) {
      setTimeLeft(parseInt(savedTimeLeft));
      setPhaseStartTime(new Date(savedPhaseStartTime));
      setPhaseEndTime(new Date(savedPhaseEndTime));
      if (savedProgress) {
        setProgress(parseFloat(savedProgress));
      }
    } else {
      initializePhase(isBreak);
    }
  }, [isBreak]);

  const initializePhase = useCallback(
    (isBreakPhase: boolean) => {
      const now = new Date();
      setPhaseStartTime(now);
      const endTime = calculatePhaseEndTime(now, isBreakPhase);
      setPhaseEndTime(endTime);
      setTimeLeft(endTime.getTime() - now.getTime());

      localStorage.setItem("currentPhase", isBreakPhase ? "break" : "study");
      localStorage.setItem("phaseStartTime", now.toISOString());
      localStorage.setItem("phaseEndTime", endTime.toISOString());
      localStorage.setItem(
        "timeLeft",
        (endTime.getTime() - now.getTime()).toString()
      );

      if (isBreakPhase) {
        setCurrentBreakSuggestion(
          breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)]
        );
      }
    },
    [calculatePhaseEndTime]
  );

  useEffect(() => {
    loadSavedState();

    // Add event listener for beforeunload
    const handleBeforeUnload = () => {
      localStorage.setItem("timeLeft", timeLeft.toString());
      localStorage.setItem("progress", progress.toString());
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loadSavedState]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const now = new Date();

      // Handle phase transition
      if (now >= phaseEndTime) {
        const newIsBreak = !isBreak;
        setIsBreak(newIsBreak);
        initializePhase(newIsBreak);
        onPhaseChange(newIsBreak ? "break" : "study");
        return;
      }

      const timeRemaining = phaseEndTime.getTime() - now.getTime();
      setTimeLeft(Math.max(0, timeRemaining));

      const start = new Date(startTime);
      const totalDuration = duration * 60 * 1000;
      const elapsed = now.getTime() - start.getTime();
      const newProgress = Math.min(100, (elapsed / totalDuration) * 100);

      setProgress(newProgress);
      localStorage.setItem("progress", newProgress.toString());

      if (elapsed >= totalDuration) {
        clearInterval(timer);
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isPaused,
    phaseEndTime,
    startTime,
    duration,
    onComplete,
    isBreak,
    initializePhase,
    onPhaseChange,
  ]);

  const handlePause = () => {
    setIsPaused(true);
    localStorage.setItem("isPaused", "true");
    onPause(progress);
  };

  const handleResume = () => {
    setIsPaused(false);
    localStorage.setItem("isPaused", "false");
    onResume();
  };

  const handleSkipPhase = () => {
    const newIsBreak = !isBreak;
    setIsBreak(newIsBreak);
    initializePhase(newIsBreak);
    onPhaseChange(newIsBreak ? "break" : "study");
  };

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateNextPhaseTime = () => {
    const nextPhaseIn = Math.floor(timeLeft / 1000 / 60);
    const nextPhaseType = isBreak ? "Focused Study" : "Break";
    return `Next: ${nextPhaseType} in ${nextPhaseIn} minute${
      nextPhaseIn !== 1 ? "s" : ""
    }`;
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 relative">
      <div
        className={`flex ${
          isMobile ? "flex-col gap-4" : "items-center justify-between mb-4"
        }`}
      >
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
          className="animate-pulse self-start"
        >
          {isBreak ? "Break Time" : "Study Time"}
        </Badge>
      </div>

      <div
        className={`${
          isMobile ? "space-y-4" : "flex items-center justify-between mb-6"
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Current phase ends at: {format(phaseEndTime, "hh:mm a")}
          </div>
          <div className="text-sm font-medium text-primary">
            {calculateNextPhaseTime()}
          </div>
          {isBreak && (
            <div className="text-sm italic text-muted-foreground mt-2 max-w-md">
              Suggestion: {currentBreakSuggestion}
            </div>
          )}
        </div>
        <CircularProgress value={progress} max={100} size={60} />
      </div>

      <div
        className={`${
          isMobile ? "space-y-4" : "flex justify-between items-center"
        }`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/chatbot")}
          className="gap-2 w-full sm:w-auto"
        >
          <MessageSquare className="h-4 w-4" />
          Need help? Chat with Kai!
        </Button>

        <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipPhase}
            className="w-full sm:w-auto"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip {isBreak ? "Break" : "Study"} Phase
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={isPaused ? handleResume : handlePause}
            className="w-full sm:w-auto"
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
      </div>
    </Card>
  );
}
