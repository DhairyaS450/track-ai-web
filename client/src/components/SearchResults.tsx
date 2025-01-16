import { Check, Clock, Edit2, FileText, X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "task" | "event" | "study";
  dueDate?: Date;
  completed?: boolean;
}

interface SearchResultsProps {
  results: SearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, type: string) => void;
  onToggleComplete: (id: string, type: string) => void;
}

export function SearchResults({ results, isOpen, onClose, onEdit, onToggleComplete }: SearchResultsProps) {
  console.log("SearchResults render:", { results, isOpen });
  
  if (!isOpen) return null;

  const groupedResults = results.reduce((acc, result) => {
    const category = result.type === "task" ? "Tasks" : 
                    result.type === "event" ? "Events" : "Study Sessions";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  console.log("Grouped results:", groupedResults);

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
        return <FileText className="h-4 w-4" />;
      case "Events":
        return <Clock className="h-4 w-4" />;
      case "Study Sessions":
        return <FileText className="h-4 w-4" />;
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
                      item.completed && "line-through text-muted-foreground"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7"
                      onClick={() => onToggleComplete(item.id, item.type)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
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
