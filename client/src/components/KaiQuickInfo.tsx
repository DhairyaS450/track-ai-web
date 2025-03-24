import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface KaiQuickInfoProps {
  onNewChat?: () => void;
  suggestionsEnabled?: boolean;
  onToggleSuggestions?: (enabled: boolean) => void;
}

export function KaiQuickInfo({ 
  onNewChat, 
  suggestionsEnabled = true,
  onToggleSuggestions
}: KaiQuickInfoProps) {
  const funFacts = [
    "I'm named after Kairos (meaning 'time' in Greek) and Kai (meaning 'sea' in Hawaiian) 🌊",
    "Like the tides, I help you flow between tasks and stay productive! 🌊",
    "I was born from the waves of knowledge to be your study companion! 📚",
    "I can adapt to your schedule like the ocean adapts to the moon's pull 🌙",
    "I'm your digital lighthouse in the sea of tasks! 🏝️",
    "I speak the language of productivity and occasional dad jokes 😉",
    "I'm named after Kairos (meaning 'time' in Greek) and Kai (meaning 'sea' in Hawaiian) 🌊",
    "My favorite number is 8 - it looks like waves when sideways! ∞",
  ];

  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src="/chatbot-icon.png" alt="Kai" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] animate-in fade-in-0 zoom-in-95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/chatbot-icon.png" alt="Kai" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            Meet Kai
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hey! I'm Kai, your AI productivity assistant born from the waves of knowledge. 
            Like the tides, I'm here to help you flow through tasks, stay organized, and 
            ride the waves of productivity!
          </p>
          
          {onToggleSuggestions && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="suggestions-mode" 
                checked={suggestionsEnabled}
                onCheckedChange={onToggleSuggestions}
              />
              <Label htmlFor="suggestions-mode" className="text-sm cursor-pointer">
                Show quick suggestions
              </Label>
            </div>
          )}
          
          <div className="bg-secondary/10 p-3 rounded-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Fun Fact
            </p>
            <p className="text-sm mt-1">{randomFact}</p>
          </div>
          
          {onNewChat && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onNewChat}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Start New Chat
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 