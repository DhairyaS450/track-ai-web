import * as React from "react"
import { format, addHours, addMinutes, setHours, setMinutes } from "date-fns"
import { EnhancedDatePicker } from "./enhanced-date-picker"
import { Input } from "./input"
import { Label } from "./label"
import { Button } from "./button"
import { Clock, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
  className?: string
  disabled?: boolean
  label?: string
  showTime?: boolean
  quickSelectOptions?: {
    label: string
    value: Date
    description?: string
  }[]
}

export function DateTimePicker({
  date,
  setDate,
  className,
  disabled,
  label,
  showTime = true,
  quickSelectOptions,
}: DateTimePickerProps) {
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Preserve the time when changing the date
      const currentTime = date
      newDate.setHours(currentTime.getHours())
      newDate.setMinutes(currentTime.getMinutes())
      setDate(newDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setDate(newDate)
  }

  const adjustTime = (minutes: number) => {
    const newDate = new Date(date)
    if (minutes > 0) {
      newDate.setMinutes(newDate.getMinutes() + minutes)
    } else {
      newDate.setMinutes(newDate.getMinutes() - Math.abs(minutes))
    }
    setDate(newDate)
  }

  const quickTimeOptions = [
    { label: "+1h", value: 60 },
    { label: "+30m", value: 30 },
    { label: "+15m", value: 15 },
    { label: "-15m", value: -15 },
    { label: "-30m", value: -30 },
    { label: "-1h", value: -60 },
  ]

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="flex flex-col gap-2">
        <EnhancedDatePicker
          date={date}
          setDate={handleDateChange}
          disabled={disabled}
          quickSelectOptions={quickSelectOptions}
        />
        {showTime && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={format(date, "HH:mm")}
                onChange={handleTimeChange}
                className="pl-9"
                disabled={disabled}
                step={600}
              />
            </div>
            <div className="flex gap-1">
              {quickTimeOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => adjustTime(option.value)}
                  disabled={disabled}
                >
                  {option.value > 0 ? (
                    <Plus className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  <span className="ml-1">{Math.abs(option.value)}m</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 