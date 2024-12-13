import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar, BookOpen, CheckSquare } from "lucide-react";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: 'task' | 'event' | 'session') => void;
}

export function AddItemDialog({
  open,
  onOpenChange,
  onSelectOption,
}: AddItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => onSelectOption('task')}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => onSelectOption('event')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Event
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => onSelectOption('session')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Add Study Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}