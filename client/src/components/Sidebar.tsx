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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SyncDialog } from "./SyncDialog";

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
  const [isDialogOpen, setDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleQuickMessage = () => {
    if (quickMessage.trim()) {
      navigate("/chatbot", { state: { message: quickMessage } });
      setQuickMessage("");
      if (isMobile) {
        onOpenChange(false);
      }
    }
  };

  const handleAddItemSelect = (option: 'task' | 'event' | 'session') => {
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
          <h1 className="text-xl font-bold">Track AI</h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
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
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
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
            className="w-full justify-start"
            onClick={() => setAddItemOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <Button
            className="w-full justify-start"
            onClick={() => {
              // await syncGoogleCalendar()
              // toast({
              //   title: 'Success',
              //   description: 'Successfully synced Google Calendar events',
              // })

              setDialogOpen(true);
            }}
          >
            <Sync className="h-4 w-4 mr-2" />
            Sync Calendar
          </Button>
          <div className="flex gap-2">
            <Input
              placeholder="Quick message..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickMessage();
                }
              }}
            />
            <Button size="icon" onClick={handleQuickMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
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
        onTaskCreated={() => {
          setCreateTaskOpen(false);
        }}
        mode="create"
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={() => {
          setCreateEventOpen(false);
        }}
        mode="create"
        tasks={[]}
      />

      <CreateStudySessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSessionCreated={() => {
          setCreateSessionOpen(false);
        }}
        mode="create"
        tasks={[]}
        events={[]}
      />

      <SyncDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}>
      </SyncDialog>
    </>
  );
}