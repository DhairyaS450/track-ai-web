import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";

export interface TaskFilters {
  status?: 'completed' | 'in-progress' | 'todo';
  priority?: 'High' | 'Medium' | 'Low';
  deadline?: 'today' | 'week' | 'month' | 'overdue';
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
  search?: string;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  onReset: () => void;
}

export function TaskFilters({ filters, onFilterChange, onReset }: TaskFiltersProps) {
  const handleStatusChange = (value: string | undefined) => {
    onFilterChange({
      ...filters,
      status: value as TaskFilters['status']
    });
  };

  const handlePriorityChange = (value: string | undefined) => {
    onFilterChange({
      ...filters,
      priority: value as TaskFilters['priority']
    });
  };

  const handleDeadlineChange = (value: string | undefined) => {
    onFilterChange({
      ...filters,
      deadline: value as TaskFilters['deadline']
    });
  };

  const handleRecurrenceChange = (value: string | undefined) => {
    onFilterChange({
      ...filters,
      recurrence: value as TaskFilters['recurrence']
    });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({
      ...filters,
      search: value || undefined
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 border-dashed"
          size="sm"
        >
          <Filter className="mr-2 h-4 w-4" />
          {Object.keys(filters).length > 0 ? (
            <span>
              {Object.keys(filters).length} active {Object.keys(filters).length === 1 ? 'filter' : 'filters'}
            </span>
          ) : (
            "Filter tasks"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Search moved to top */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by keyword..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Priority</SelectLabel>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Select
                  value={filters.deadline}
                  onValueChange={handleDeadlineChange}
                >
                  <SelectTrigger id="deadline">
                    <SelectValue placeholder="Select deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Deadline</SelectLabel>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="week">Due This Week</SelectItem>
                      <SelectItem value="month">Due This Month</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurrence</Label>
                <Select
                  value={filters.recurrence}
                  onValueChange={handleRecurrenceChange}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Recurrence</SelectLabel>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="none">One-time Only</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}