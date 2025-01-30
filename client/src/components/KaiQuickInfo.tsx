import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface KaiQuickInfoProps {
  onNewChat: () => void;
}

export function KaiQuickInfo({ onNewChat }: KaiQuickInfoProps) {
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
          <div className="bg-secondary/10 p-3 rounded-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Fun Fact
            </p>
            <p className="text-sm text-muted-foreground">{randomFact}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Try asking me:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>"Help me ride the productivity wave today! 🏄‍♂️"</li>
              <li>"What's on my tide chart (schedule) for this week?"</li>
              <li>"I'm drowning in tasks! Help me organize them!"</li>
            </ul>
          </div>
          <Button className="w-full" onClick={onNewChat}>
            Start New Chat with Kai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 