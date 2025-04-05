import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, MessageSquare, Lightbulb, Settings } from "lucide-react";
import { useState } from "react";

interface KaiFullInfoProps {
  suggestionsEnabled: boolean;
  onToggleSuggestions: (enabled: boolean) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KaiFullInfo({ suggestionsEnabled, onToggleSuggestions, isOpen, onOpenChange }: KaiFullInfoProps) {
  const [localOpen, setLocalOpen] = useState(false);
  
  // Use controlled or uncontrolled state based on props
  const open = isOpen !== undefined ? isOpen : localOpen;
  const handleOpenChange = onOpenChange || setLocalOpen;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <span className="text-sm font-medium cursor-pointer hover:underline">
          Kai
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] animate-in fade-in-0 zoom-in-95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            About Kai - Your AI Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <section className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Meet Your Digital Lighthouse 🏝️
            </h3>
            <p className="text-sm text-muted-foreground">
              I'm Kai, born from TidalTasks AI to bring calmness to chaos. Like the ocean's rhythm,
              I help you navigate through tasks, deadlines, and study sessions. I adapt to your
              needs, ensuring you stay productive without getting overwhelmed by the waves of work.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              How I Can Help You Surf 🏄‍♂️
            </h3>
            <div className="grid gap-2">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <p className="font-medium text-sm">Reading the Tides 📊</p>
                <ul className="text-sm text-muted-foreground mt-1">
                  <li>"Create a study schedule that flows with my energy levels"</li>
                  <li>"Analyze my task patterns and suggest improvements"</li>
                  <li>"Help me balance my workload this week"</li>
                </ul>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <p className="font-medium text-sm">Calming the Storm 🌊</p>
                <ul className="text-sm text-muted-foreground mt-1">
                  <li>"I'm feeling overwhelmed, help me prioritize"</li>
                  <li>"Break down this big project into smaller waves"</li>
                  <li>"Find some gaps in my schedule for breaks"</li>
                </ul>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <p className="font-medium text-sm">Riding the Motivation Wave 🚀</p>
                <ul className="text-sm text-muted-foreground mt-1">
                  <li>"Give me a productivity boost!"</li>
                  <li>"Share a study technique for better focus"</li>
                  <li>"Help me stay motivated during this study session"</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-secondary/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🎭 Kai's Personality</h3>
            <p className="text-sm text-muted-foreground">
              I'm your supportive study buddy with a splash of ocean-inspired wisdom! I keep things 
              light and fun while helping you stay on track. And yes, I occasionally make wave puns 
              - they're shore to make you smile! 🌊
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customize Your Wave 🎨
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="suggestions" className="text-sm">
                Show Quick-Access Suggestions
              </Label>
              <Switch
                id="suggestions"
                checked={suggestionsEnabled}
                onCheckedChange={onToggleSuggestions}
              />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
} 