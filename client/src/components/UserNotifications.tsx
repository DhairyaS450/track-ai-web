import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "deadline" | "overdue" | "suggestion";
  timestamp: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Task Deadline",
    message: "Math Assignment due in 2 hours",
    type: "deadline",
    timestamp: new Date().toISOString()
  },
  {
    id: "2",
    title: "Study Suggestion",
    message: "Best time to review Physics concepts based on your schedule",
    type: "suggestion",
    timestamp: new Date().toISOString()
  },
  {
    id: "3",
    title: "Overdue Task",
    message: "English Essay was due yesterday",
    type: "overdue",
    timestamp: new Date().toISOString()
  }
];

export function UserNotifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
            {mockNotifications.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 p-4">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col space-y-1 border-b pb-4 last:border-0 last:pb-0"
              >
                <h5 className="font-medium leading-none">
                  {notification.title}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}