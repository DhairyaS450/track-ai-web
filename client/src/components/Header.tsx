import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Search, Menu } from "lucide-react";
import { Input } from "./ui/input";
import { UserNotifications } from "./UserNotifications";
import { UserProfileMenu } from "./UserProfileMenu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/calendar":
        return "Calendar";
      case "/study":
        return "Study Sessions";
      case "/analytics":
        return "Analytics";
      case "/settings":
        return "Settings";
      default:
        return "Track AI Web";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="Track AI Web" className="h-8 w-auto" />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-4 max-w-2xl w-full">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {format(date, "EEEE, MMMM d, yyyy")}
              <span className="ml-2 font-medium">
                {format(date, "h:mm:ss a")}
              </span>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, events, or deadlines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <UserNotifications />
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}