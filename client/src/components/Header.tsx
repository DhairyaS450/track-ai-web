/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Menu } from "lucide-react";
import { Input } from "./ui/input";
import { NotificationBell } from "./notifications/NotificationBell";
import { UserProfileMenu } from "./UserProfileMenu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { SearchResults } from "./SearchResults";
import { searchItems, type SearchResult } from "@/api/search";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataProvider";
import { UnifiedItemDialog } from "./UnifiedItemDialog";
import { ItemType, convertToUnified } from "@/types/unified";
import { useItemManager } from "@/hooks/useItemManager";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { toast } = useToast();
  const data = useData();
  const { tasks, events, sessions, reminders, deleteTask, dismissReminder } = data;
  const navigate = useNavigate();
  const { handleSaveItem } = useItemManager();
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [initialItemType, setInitialItemType] = useState<ItemType>("task");
  
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        setIsSearchOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Searching for:", debouncedSearch, "with data:", data);
        const results = await searchItems(debouncedSearch, data);
        console.log("Search results:", results);
        setSearchResults(results);
        setIsSearchOpen(true);
        console.log("Search open:", isSearchOpen);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearch, data, isSearchOpen]);

  const handleEdit = async (id: string, type: string) => {
    setIsSearchOpen(false);
    setSearch("");
    
    try {
      let item;
      let itemType: ItemType;
      
      switch (type) {
        case "task":
          item = tasks.find(task => task.id === id);
          itemType = "task";
          break;
        case "event":
          item = events.find(event => event.id === id);
          itemType = "event";
          break;
        case "study":
          item = sessions.find(session => session.id === id);
          itemType = "session";
          break;
        case "reminder":
          item = reminders.find(reminder => reminder.id === id);
          itemType = "reminder";
          break;
        default:
          throw new Error(`Unknown item type: ${type}`);
      }
      
      if (item) {
        const unifiedItem = convertToUnified(item, itemType);
        setSelectedItem(unifiedItem);
        setInitialItemType(itemType);
        setIsItemDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load item",
      });
    }
  };

  const handleToggleComplete = async (id: string, type: string) => {
    try {
      switch (type) {
        case "task":
          await deleteTask(id);
          break;
        case "reminder":
          await dismissReminder(id);
          break;
      }
      
      // Refresh search results
      const results = await searchItems(search, data);
      setSearchResults(results);

      toast({
        title: "Success",
        description: `${type === "reminder" ? "Dismissed" : "Completed"} successfully`,
      });
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${type === "reminder" ? "dismiss" : "complete"} ${type}`,
      });
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
          <img 
            src="/logo.png" 
            alt="TidalTasks AI" 
            className="h-8 w-auto cursor-pointer" 
            onClick={() => navigate("/")}
          />
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
              <Search className={cn(
                "absolute left-2 top-2.5 h-4 w-4",
                isLoading ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <Input
                placeholder="Search (case sensitive)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  console.log("Search input:", e.target.value);
                }}
                className="pl-8"
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setIsSearchOpen(true);
                  }
                }}
              />
              {(isSearchOpen || isLoading) && (
                <div className="absolute top-full left-0 w-full z-50">
                  <SearchResults
                    results={searchResults}
                    isOpen={isSearchOpen}
                    onClose={() => {
                      setIsSearchOpen(false);
                      setSearch("");
                    }}
                    onEdit={handleEdit}
                    onToggleComplete={handleToggleComplete}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <NotificationBell />
          <UserProfileMenu />
        </div>
      </div>
      <UnifiedItemDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        initialItem={selectedItem}
        initialType={initialItemType}
        onSave={handleSaveItem}
        mode="edit"
      />
    </header>
  );
}