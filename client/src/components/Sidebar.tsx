import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
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
import { FeedbackDialog } from "./FeedbackDialog";
import { SyncDialog } from "./SyncDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toast } from "@/hooks/useToast";
import { useData } from "@/contexts/DataProvider";

// Import unified item components
import { 
  SchedulableItem, 
  ItemType, 
  convertFromUnified 
} from "@/types/unified";
import { UnifiedItemDialog } from "./UnifiedItemDialog";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Study Sessions", href: "/study", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Unified dialog states
  const [unifiedItemDialogOpen, setUnifiedItemDialogOpen] = useState(false);
  const selectedItemType = useState<ItemType>('task')[0];

  const { 
    addTask, 
    addEvent, 
    addSession,
  } = useData();
  
  const handleQuickMessage = () => {
    if (quickMessage.trim()) {
      navigate("/chatbot", { state: { message: quickMessage } });
      setQuickMessage("");
      if (isMobile) {
        onOpenChange(false);
      }
    }
  };

  // Handler for when a new item is saved
  const handleSaveItem = async (item: SchedulableItem) => {
    try {
      const convertedItem = convertFromUnified(item);
      
      switch (item.itemType) {
        case 'task':
          await addTask(convertedItem);
          break;
        case 'event':
          await addEvent(convertedItem);
          break;
        case 'session':
          await addSession(convertedItem);
          break;
      }
      
      setUnifiedItemDialogOpen(false);
      toast({
        title: "Success",
        description: `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} created successfully`,
      });
      
      if (isMobile) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error(`Error creating ${item.itemType}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create ${item.itemType}`,
      });
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
          <h1 className="text-xl font-bold dark:text-[#e0e0e0]">TidalTasks AI</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-4 py-2">
          <Button 
            className="w-full justify-start mb-2" 
            onClick={() => setUnifiedItemDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <form 
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickMessage();
            }}
          >
            <Input 
              placeholder="Quick message..."
              className="h-8"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <nav className="space-y-1 px-2 py-5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                )}
                onClick={() => {
                  if (isMobile) {
                    onOpenChange(false);
                  }
                }}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setFeedbackOpen(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Feedback
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setDialogOpen(true)}
            >
              <Sync className="mr-2 h-4 w-4" />
              Sync Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Item Dialog */}
      <UnifiedItemDialog
        open={unifiedItemDialogOpen}
        onOpenChange={setUnifiedItemDialogOpen}
        initialItem={null}
        initialType={selectedItemType}
        onSave={handleSaveItem}
        mode="create"
      />

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />

      <SyncDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}