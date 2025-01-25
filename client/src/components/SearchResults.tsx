import { Check, CheckSquare, Bell, BookOpen, Calendar, Clock, Edit2, FileText, X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "task" | "event" | "study" | "deadline" | "reminder";
  dueDate?: Date;
  completed?: boolean;
  status?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, type: string) => void;
  onToggleComplete: (id: string, type: string) => void;
}

export function SearchResults({ results, isOpen, onClose, onEdit, onToggleComplete }: SearchResultsProps) {
  if (!isOpen) return null;

  const groupedResults = results.reduce((acc, result) => {
    const category = result.type === "task" ? "Tasks" : 
                    result.type === "event" ? "Events" : 
                    result.type === "study" ? "Study Sessions" :
                    result.type === "deadline" ? "Deadlines" :
                    "Reminders";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (Object.keys(groupedResults).length === 0) {
    return (
      <div className="w-full mt-1 bg-background rounded-md border shadow-lg p-4">
        <p className="text-sm text-muted-foreground text-center">No results found</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "Tasks":
        return <CheckSquare className="h-4 w-4" />;
      case "Events":
        return <Calendar className="h-4 w-4" />;
      case "Study Sessions":
        return <BookOpen className="h-4 w-4" />;
      case "Deadlines":
        return <Clock className="h-4 w-4" />;
      case "Reminders":
        return <Bell className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "task":
      case "deadline":
        return <Check className="h-4 w-4" />;
      case "reminder":
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full mt-1 bg-background rounded-md border shadow-lg">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium">Search Results</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[300px] overflow-y-auto">
        {Object.entries(groupedResults).map(([category, items]) => (
          <div key={category} className="p-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              {getIcon(category)}
              {category}
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm",
                      (item.completed || item.status === "Completed" || item.status === "Dismissed") && 
                      "line-through text-muted-foreground"
                    )}>
                      {item.title}
                    </span>
                    {item.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(item.dueDate, "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7"
                      onClick={() => onEdit(item.id, item.type)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {(item.type === "task" || item.type === "deadline" || item.type === "reminder") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7"
                        onClick={() => onToggleComplete(item.id, item.type)}
                      >
                        {getActionIcon(item.type)}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
