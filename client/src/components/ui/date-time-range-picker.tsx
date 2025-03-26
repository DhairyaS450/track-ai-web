import * as React from "react"
import { format, setHours, setMinutes, addMinutes } from "date-fns"
import { DateRangePicker, DateRange } from "./date-range-picker"
import { Input } from "./input"
import { Label } from "./label"
import { Button } from "./button"
import { Clock, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export type DateTimeRange = {
  from: Date
  to?: Date
}

interface DateTimeRangePickerProps {
  dateTimeRange: DateTimeRange
  setDateTimeRange: (dateTimeRange: DateTimeRange) => void
  className?: string
  disabled?: boolean
  label?: string
  showTime?: boolean
  align?: "center" | "start" | "end"
}

export function DateTimeRangePicker({
  dateTimeRange,
  setDateTimeRange,
  className,
  disabled,
  label,
  showTime = true,
  align = "start",
}: DateTimeRangePickerProps) {
  const handleDateRangeChange = (newDateRange: DateRange) => {
    const newRange: DateTimeRange = {
      from: newDateRange.from,
      to: newDateRange.to
    }

    // Preserve time from the original range
    if (dateTimeRange.from) {
      newRange.from.setHours(dateTimeRange.from.getHours())
      newRange.from.setMinutes(dateTimeRange.from.getMinutes())
    }

    if (dateTimeRange.to && newRange.to) {
      newRange.to.setHours(dateTimeRange.to.getHours())
      newRange.to.setMinutes(dateTimeRange.to.getMinutes())
    }

    setDateTimeRange(newRange)
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    const newFrom = new Date(dateTimeRange.from)
    newFrom.setHours(hours)
    newFrom.setMinutes(minutes)

    const newRange = { ...dateTimeRange, from: newFrom }
    setDateTimeRange(newRange)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dateTimeRange.to) return

    const [hours, minutes] = e.target.value.split(":").map(Number)
    const newTo = new Date(dateTimeRange.to)
    newTo.setHours(hours)
    newTo.setMinutes(minutes)

    const newRange = { ...dateTimeRange, to: newTo }
    setDateTimeRange(newRange)
  }

  const adjustTime = (target: 'from' | 'to', minutes: number) => {
    if (target === 'to' && !dateTimeRange.to) return

    const newRange = { ...dateTimeRange }
    const dateToAdjust = target === 'from' ? newRange.from : newRange.to!
    
    const adjustedDate = addMinutes(dateToAdjust, minutes)
    
    if (target === 'from') {
      newRange.from = adjustedDate
    } else {
      newRange.to = adjustedDate
    }
    
    setDateTimeRange(newRange)
  }

  const quickTimeOptions = [
    { label: "+15m", value: 15 },
    { label: "+30m", value: 30 },
    { label: "+1h", value: 60 },
    { label: "-15m", value: -15 },
    { label: "-30m", value: -30 },
    { label: "-1h", value: -60 },
  ]

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="flex flex-col gap-3">
        <DateRangePicker
          dateRange={dateTimeRange}
          setDateRange={handleDateRangeChange}
          disabled={disabled}
          align={align}
        />
        
        {showTime && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <div className="flex-grow space-y-1">
                <Label className="text-xs">Start Time</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={format(dateTimeRange.from, "HH:mm")}
                      onChange={handleStartTimeChange}
                      className="pl-9"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex gap-1">
                    {quickTimeOptions.slice(0, 3).map((option) => (
                      <Button
                        key={`from-${option.label}`}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => adjustTime('from', option.value)}
                        disabled={disabled}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="ml-1">{option.label.replace('+', '')}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {dateTimeRange.to && (
                <div className="flex-grow space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={format(dateTimeRange.to, "HH:mm")}
                        onChange={handleEndTimeChange}
                        className="pl-9"
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex gap-1">
                      {quickTimeOptions.slice(0, 3).map((option) => (
                        <Button
                          key={`to-${option.label}`}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => adjustTime('to', option.value)}
                          disabled={disabled}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="ml-1">{option.label.replace('+', '')}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                {format(dateTimeRange.from, "PPP")} at {format(dateTimeRange.from, "p")}
              </div>
              {dateTimeRange.to && (
                <div>
                  to {format(dateTimeRange.to, "PPP")} at {format(dateTimeRange.to, "p")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 