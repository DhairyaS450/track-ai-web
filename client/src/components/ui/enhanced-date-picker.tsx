import * as React from "react"
import { format, addDays, addWeeks, addMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Calendar } from "./calendar"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Clock, ChevronDown } from "lucide-react"
import { ScrollArea } from "./scroll-area"

interface EnhancedDatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  quickSelectOptions?: {
    label: string
    value: Date
    description?: string
  }[]
}

export function EnhancedDatePicker({
  date,
  setDate,
  className,
  disabled,
  placeholder = "Pick a date",
  quickSelectOptions = [
    { 
      label: "Today", 
      value: startOfDay(new Date()),
      description: "Set for today"
    },
    { 
      label: "Tomorrow", 
      value: startOfDay(addDays(new Date(), 1)),
      description: "Set for tomorrow"
    },
    { 
      label: "This Week", 
      value: startOfWeek(new Date()),
      description: "Set for this week"
    },
    { 
      label: "Next Week", 
      value: startOfWeek(addWeeks(new Date(), 1)),
      description: "Set for next week"
    },
    { 
      label: "This Month", 
      value: startOfMonth(new Date()),
      description: "Set for this month"
    },
    { 
      label: "Next Month", 
      value: startOfMonth(addMonths(new Date(), 1)),
      description: "Set for next month"
    },
  ],
}: EnhancedDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-between text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="text-sm font-medium mb-2">Quick Select</div>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-1 gap-2">
              {quickSelectOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  className="justify-start font-normal h-auto py-2 px-3"
                  onClick={() => {
                    setDate(option.value)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="p-3">
          <div className="text-sm font-medium mb-2">Calendar</div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate)
              setIsOpen(false)
            }}
            initialFocus
            disabled={(date) => date < startOfDay(new Date())}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
} 