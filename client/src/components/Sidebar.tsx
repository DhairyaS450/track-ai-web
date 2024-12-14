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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { AddItemDialog } from "./AddItemDialog";
import { FeedbackDialog } from "./FeedbackDialog";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Study Sessions", href: "/study", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");

  const handleQuickMessage = () => {
    if (quickMessage.trim()) {
      navigate("/chatbot", { state: { message: quickMessage } });
      setQuickMessage("");
    }
  };

  const handleAddItemSelect = (option: 'task' | 'event' | 'session') => {
    setAddItemOpen(false);
    switch (option) {
      case 'task':
        navigate('/calendar', { state: { openAddTask: true } });
        break;
      case 'event':
        navigate('/calendar', { state: { openAddEvent: true } });
        break;
      case 'session':
        navigate('/study', { state: { openAddSession: true } });
        break;
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Track AI</h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
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

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSelectOption={handleAddItemSelect}
      />

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </div>
  );
}