import * as React from "react"
import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isBefore,
  isAfter,
  isEqual 
} from "date-fns"
import { Calendar } from "./calendar"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, ChevronDown, ArrowRight } from "lucide-react"
import { ScrollArea } from "./scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./tabs"

export type DateRange = {
  from: Date
  to?: Date
}

interface DateRangePickerProps {
  dateRange: DateRange
  setDateRange: (dateRange: DateRange) => void
  className?: string
  disabled?: boolean
  align?: "center" | "start" | "end"
}

interface QuickSelectOption {
  label: string
  value: DateRange
  description?: string
}

export function DateRangePicker({
  dateRange,
  setDateRange,
  className,
  disabled,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"range" | "start" | "end">("range")

  const today = startOfDay(new Date())
  const tomorrow = startOfDay(addDays(today, 1))
  const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
  const thisMonthStart = startOfMonth(today)
  const thisMonthEnd = endOfMonth(today)
  const nextMonthStart = startOfMonth(addMonths(today, 1))
  const nextMonthEnd = endOfMonth(addMonths(today, 1))

  const quickSelectOptions: QuickSelectOption[] = [
    { 
      label: "Today", 
      value: { from: today, to: today },
      description: "Just for today"
    },
    { 
      label: "Today → Tomorrow", 
      value: { from: today, to: tomorrow },
      description: "From today until tomorrow"
    },
    { 
      label: "This Week", 
      value: { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) },
      description: "The current week"
    },
    { 
      label: "Next Week", 
      value: { from: nextWeekStart, to: nextWeekEnd },
      description: "The entire next week"
    },
    { 
      label: "This Month", 
      value: { from: thisMonthStart, to: thisMonthEnd },
      description: "The current month"
    },
    { 
      label: "Next Month", 
      value: { from: nextMonthStart, to: nextMonthEnd },
      description: "The entire next month"
    },
    { 
      label: "Next 7 Days", 
      value: { from: today, to: addDays(today, 6) },
      description: "From today for the next 7 days"
    },
    { 
      label: "Next 30 Days", 
      value: { from: today, to: addDays(today, 29) },
      description: "From today for the next 30 days"
    },
  ]

  const formatDateRange = () => {
    if (!dateRange.from) {
      return "Select date range"
    }
    
    if (!dateRange.to || isEqual(dateRange.from, dateRange.to)) {
      return format(dateRange.from, "PPP")
    }
    
    return `${format(dateRange.from, "PPP")} → ${format(dateRange.to, "PPP")}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-left font-normal",
            !dateRange.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formatDateRange()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align={align}
        sideOffset={5}
      >
        <div className="space-y-4 p-3">
          <div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="range">Range</TabsTrigger>
                <TabsTrigger value="start">Start Date</TabsTrigger>
                <TabsTrigger value="end">End Date</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="p-3 border-b">
            <div className="text-sm font-medium mb-2">Quick Select</div>
            <ScrollArea className="h-[180px]">
              <div className="grid grid-cols-1 gap-2">
                {quickSelectOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="outline"
                    className="justify-start font-normal h-auto py-2 px-3"
                    onClick={() => {
                      setDateRange(option.value)
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
          
          <div className="px-3">
            {activeTab === "range" && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Select Range</div>
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to || dateRange.from
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to
                      })
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                />
              </div>
            )}
            
            {activeTab === "start" && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Select Start Date</div>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      // Ensure end date is not before start date
                      const to = dateRange.to && isBefore(date, dateRange.to) 
                        ? dateRange.to 
                        : date
                      setDateRange({ from: date, to })
                      setActiveTab("end")
                    }
                  }}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                />
              </div>
            )}
            
            {activeTab === "end" && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Select End Date</div>
                <Calendar
                  mode="single"
                  selected={dateRange.to || dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      // Ensure end date is not before start date
                      const endDate = isBefore(date, dateRange.from) 
                        ? dateRange.from 
                        : date
                      setDateRange({ ...dateRange, to: endDate })
                      setIsOpen(false)
                    }
                  }}
                  disabled={(date) => isBefore(date, dateRange.from)}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between border-t pt-3 px-3">
            <div className="text-sm text-muted-foreground">
              {dateRange.from && (
                <>
                  <span>{format(dateRange.from, "PPP")}</span>
                  {dateRange.to && dateRange.to !== dateRange.from && (
                    <>
                      <ArrowRight className="inline mx-2 h-4 w-4" />
                      <span>{format(dateRange.to, "PPP")}</span>
                    </>
                  )}
                </>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 