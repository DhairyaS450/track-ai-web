/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Paperclip,
  Mic,
  Wand2,
  Calendar,
  Clock,
  CheckSquare,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  LineChart
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { processChatMessage } from '@/api/chatbot';
import { auth } from '@/config/firebase';
import { addTask, updateTask } from "@/api/tasks";
import { addEvent, updateEvent } from "@/api/events";
import { addStudySession, updateStudySession } from "@/api/sessions";
import ReactMarkdown from 'react-markdown';
import { updateDeadline } from "@/api/deadlines";
import { updateReminder } from "@/api/deadlines";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { KaiQuickInfo } from "@/components/KaiQuickInfo";
import { KaiFullInfo } from "@/components/KaiFullInfo";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: (event: any) => void;
  start: () => void;
}


declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  text: string;
  icon: JSX.Element;
  action: () => void;
}

const createSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

export function Chatbot() {
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hey there! I'm Kai, your AI productivity assistant. Need help scheduling, organizing, or just staying on track? Ask me anything!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

  useEffect(() => {
    if (location.state?.message) {
      handleSend(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.message]);

  const suggestions: Suggestion[] = [
    {
      id: '1',
      text: 'Create Task',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => setInput('Create a new task for ')
    },
    {
      id: '2',
      text: 'Schedule Study Session',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => setInput('Schedule a study session for ')
    },
    {
      id: '3',
      text: 'View Deadlines',
      icon: <Calendar className="h-4 w-4" />,
      action: () => handleSend('Show me upcoming deadlines')
    },
    {
      id: '4',
      text: 'Sync Calendar',
      icon: <Clock className="h-4 w-4" />,
      action: () => handleSend('Sync my Google Calendar')
    },
    {
      id: '5',
      text: 'Track Progress',
      icon: <LineChart className="h-4 w-4" />,
      action: () => handleSend('Show my study progress')
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string = input) => {
    if (!content.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: 'Please log in to use the chatbot.',
        timestamp: new Date()
      }]);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to the format expected by the API
      const chatHistory = messages.map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      const { response: result } = await processChatMessage(content, chatHistory);
      
      console.log(JSON.stringify(result, null, 2));


      // Handle any actions returned by the chatbot
      if (result.action) {
        console.log(result.action);
        switch (result.action.type) {
          case 'CREATE_TASK':
            await addTask(result.action.data);
            break;
          case 'CREATE_EVENT':
            await addEvent(result.action.data);
            break;
          case 'CREATE_SESSION':
            await addStudySession(result.action.data);
            break;
          case 'UPDATE_TASK':
            await updateTask(result.action.data.id, result.action.data);
            break;
          case 'UPDATE_EVENT':
            await updateEvent(result.action.data.id, result.action.data);
            break;
          case 'UPDATE_SESSION':
            await updateStudySession(result.action.data.id, result.action.data);
            break;
          case 'UPDATE_REMINDER':
            await updateReminder(result.action.data.id, result.action.data);
            break;
          case 'UPDATE_DEADLINE':
            await updateDeadline(result.action.data.id, result.action.data);
            break;
            
          // ... handle other action types
        }
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response.toString(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);

    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollSuggestions = (direction: 'left' | 'right') => {
    if (suggestionsRef.current) {
      const scrollAmount = 200;
      suggestionsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const handleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(input + transcript);
      setIsListening(false);
    };


    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleNewChat = () => {
    setMessages([{
      id: '1',
      type: 'bot',
      content: "Hey there! I'm Kai, your AI productivity assistant. Need help scheduling, organizing, or just staying on track? Ask me anything!",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-6 chat-container">
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-6 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex message-animation ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-3 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {message.type === 'bot' ? (
                    <KaiQuickInfo onNewChat={handleNewChat} />
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={auth.currentUser?.photoURL || undefined} alt={auth.currentUser?.displayName || 'User'} />
                      <AvatarFallback>{auth.currentUser?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.type === 'bot' ? (
                          <KaiFullInfo
                            suggestionsEnabled={suggestionsEnabled}
                            onToggleSuggestions={setSuggestionsEnabled}
                          />
                        ) : (
                          auth.currentUser?.displayName || 'User'
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-blue-300 dark:bg-blue-700'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <ReactMarkdown 
                        className="whitespace-pre-wrap prose dark:prose-invert prose-sm max-w-none"
                      >
                        {message.content.replace(/\n/gi, '\n&nbsp;')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start message-animation">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/chatbot-icon.png" alt="Kai" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Kai</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-gray-200 dark:bg-gray-700">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 space-y-4">
        {suggestionsEnabled && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
              onClick={() => scrollSuggestions('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
              onClick={() => scrollSuggestions('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div
              ref={suggestionsRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide px-8"
            >
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  className="flex items-center space-x-2 whitespace-nowrap"
                  onClick={suggestion.action}
                >
                  {suggestion.icon}
                  <span>{suggestion.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Card className={`p-2 space-y-2 ${isMobile ? 'flex flex-col' : ''}`}>
          {isMobile ? (
            <>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a task, plan a study session, or answer your questions..."
                className="min-h-[80px] resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSpeechRecognition}
                    className={isListening ? 'text-red-500' : ''}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => handleSend()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Wand2 className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a task, plan a study session, or answer your questions..."
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeechRecognition}
                className={isListening ? 'text-red-500' : ''}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button onClick={() => handleSend()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}