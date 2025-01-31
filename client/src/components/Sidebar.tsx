import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Settings,
  MessageSquare,
  Plus,
  Send,
  MessageCircle,
  X,
  FolderSync as Sync
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { AddItemDialog } from "./AddItemDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { CreateEventDialog } from "./CreateEventDialog";
import { CreateStudySessionDialog } from "./CreateStudySessionDialog";
import { CreateDeadlineDialog } from "./CreateDeadlineDialog";
import { CreateReminderDialog } from "./CreateReminderDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SyncDialog } from "./SyncDialog";
import { Task, Event, StudySession } from "@/types";
import { Deadline, Reminder } from "@/types/deadlines";
import { toast } from "@/hooks/useToast";
import { useData } from "@/contexts/DataProvider";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Study Sessions", href: "/study", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [createDeadlineOpen, setCreateDeadlineOpen] = useState(false);
  const [createReminderOpen, setCreateReminderOpen] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { addDeadline, addReminder, addTask, addEvent, addSession } = useData();
  
  const handleQuickMessage = () => {
    if (quickMessage.trim()) {
      navigate("/chatbot", { state: { message: quickMessage } });
      setQuickMessage("");
      if (isMobile) {
        onOpenChange(false);
      }
    }
  };

  const handleAddItemSelect = (option: 'task' | 'event' | 'session' | 'deadline' | 'reminder') => {
    setAddItemOpen(false);
    switch (option) {
      case 'task':
        setCreateTaskOpen(true);
        break;
      case 'event':
        setCreateEventOpen(true);
        break;
      case 'session':
        setCreateSessionOpen(true);
        break;
      case 'deadline':
        setCreateDeadlineOpen(true);
        break;
      case 'reminder':
        setCreateReminderOpen(true);
        break;
    }
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/80 md:hidden",
          open ? "block" : "hidden"
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r transition-transform duration-200 ease-in-out md:translate-x-0 md:relative",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6 justify-between">
          <h1 className="text-xl font-bold dark:text-[#e0e0e0]">TaskTide AI</h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden dark:text-[#e0e0e0]"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => isMobile && onOpenChange(false)}
                className={cn(
                  "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-secondary text-secondary-foreground dark:text-[#e0e0e0]"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground dark:text-[#e0e0e0]/70 dark:hover:text-[#e0e0e0]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4 space-y-4">
          <Button
            className="w-full justify-start dark:text-[#e0e0e0]"
            onClick={() => setAddItemOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <Button
            className="w-full justify-start dark:text-[#e0e0e0]"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            <Sync className="h-4 w-4 mr-2" />
            Sync Calendar
          </Button>
          <div className="flex gap-2">
            <Input
              placeholder="Ask Kai anything..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickMessage();
                }
              }}
              className="dark:text-[#e0e0e0] dark:placeholder-[#e0e0e0]/50"
            />
            <Button size="icon" onClick={handleQuickMessage} className="dark:text-[#e0e0e0]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start dark:text-[#e0e0e0] dark:hover:text-[#e0e0e0]"
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Feedback
          </Button>
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSelectOption={handleAddItemSelect}
      />

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={(task: Task) => {
          try {
            addTask(task);
            setCreateTaskOpen(false);
            toast({
              title: "Success",
              description: "Task created successfully",
            });
          } catch (error) {
            console.error("Error creating task:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create task",
            });
          }
        }}
        mode="create"
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={(event: Event) => {
          try {
            addEvent(event);
            setCreateEventOpen(false);
            toast({
              title: "Success",
              description: "Event created successfully",
            });
          } catch (error) {
            console.error("Error creating event:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create event",
            });
          }
        }}
        mode="create"
        tasks={[]}
      />

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSessionCreated={(session: StudySession) => {
          try {
            addSession(session);
            setCreateSessionOpen(false);
            toast({
              title: "Success",
              description: "Session created successfully",
            });
          } catch (error) {
            console.error("Error creating session:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create session",
            });
          }
        }}
        mode="create"
        tasks={[]}
        events={[]}
      />

      <CreateDeadlineDialog
        open={createDeadlineOpen}
        onOpenChange={setCreateDeadlineOpen}
        onDeadlineCreated={(deadline: Deadline) => {
          try {
            addDeadline(deadline);
            setCreateDeadlineOpen(false);
            toast({
              title: "Success",
              description: "Deadline created successfully",
            });
          } catch (error) {
            console.error("Error creating deadline:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create deadline",
            });
          }
        }}
        mode="create"
      />

      <CreateReminderDialog
        open={createReminderOpen}
        onOpenChange={setCreateReminderOpen}
        onReminderCreated={(reminder: Reminder) => {
          try {
            addReminder(reminder);
            setCreateReminderOpen(false);
            toast({
              title: "Success",
              description: "Reminder created successfully",
            });
          } catch (error) {
            console.error("Error creating reminder:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create reminder",
            });
          }
        }}
        mode="create"
      />

      <SyncDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}