import { Button } from "@/components/ui/button";
import {
  Calendar,
  BarChart2,
  Clock,
  Bot,
  Brain,
  Sparkles,
  ArrowRight,
  Instagram,
  Youtube,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Award,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { KaiFullInfo } from "@/components/KaiFullInfo";

// Discord icon component (not available in lucide-react)
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
  </svg>
);

// TikTok icon component (not available in lucide-react)
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export function Home() {
  const navigate = useNavigate();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showKaiDialog, setShowKaiDialog] = useState(false);
  const [kaiSuggestionsEnabled, setKaiSuggestionsEnabled] = useState(true);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Shared fade-in animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // FAQ data
  const faqs = [
    {
      question: "What is TidalTasks AI?",
      answer: "TidalTasks AI is an intelligent productivity platform designed specifically for students. It combines AI-powered scheduling, a study companion chatbot named Kai, and powerful analytics to help you optimize your study time and improve academic performance."
    },
    {
      question: "How does the AI scheduling work?",
      answer: "Our AI analyzes your learning patterns, energy levels, and deadlines to create personalized study schedules. It adapts to your preferences over time, suggesting optimal study times and breaks to maximize productivity while preventing burnout."
    },
    {
      question: "Is TidalTasks available on mobile devices?",
      answer: "Yes! TidalTasks works seamlessly across all devices - desktop, tablet, and mobile. Your data syncs automatically, so you can access your schedule and chat with Kai wherever you are."
    },
    {
      question: "How do I get access to the beta version?",
      answer: "TidalTasks is currently in beta testing. You'll need an invite code to register. Join our Discord server to request an invite code or enter your email in the waitlist section below."
    },
    {
      question: "Does TidalTasks integrate with Google Calendar?",
      answer: "Absolutely! TidalTasks seamlessly integrates with Google Calendar, allowing you to see all your events in one place. Your AI-generated study sessions can be automatically added to your Google Calendar."
    },
    {
      question: "Who is Kai?",
      answer: "Kai is your AI study companion within TidalTasks. Kai helps you stay on track, answers questions about your schedule, provides study tips, and offers motivation when you need it most. Also did you know Kai means 'ocean' in Japanese?"
    }
  ];

  // How it works steps
  const howItWorks = [
    {
      icon: <PlusCircle className="w-10 h-10 text-primary" />,
      title: "Sign Up",
      description: "Create your account with an invite code and set up your profile with your academic goals."
    },
    {
      icon: <Calendar className="w-10 h-10 text-primary" />,
      title: "Connect Calendar",
      description: "Link your Google Calendar to import existing commitments and deadlines."
    },
    {
      icon: <Brain className="w-10 h-10 text-primary" />,
      title: "Student Profile",
      description: "Update your student profile to match your academic goals."
    },
    {
      icon: <Sparkles className="w-10 h-10 text-primary" />,
      title: "Get Personalized Plan",
      description: "Receive optimized time management and scheduling tips."
    }
  ];

  // Stats/benefits data
  const stats = [
    { value: "4.1%", label: "Average increase in grades", icon: <Zap className="w-8 h-8 text-yellow-500" /> },
    { value: "3.2h", label: "Weekly time saved", icon: <Clock className="w-8 h-8 text-blue-500" /> },
    { value: "87%", label: "Students report less stress", icon: <Target className="w-8 h-8 text-green-500" /> },
    { value: "91%", label: "Would recommend to friends", icon: <Award className="w-8 h-8 text-purple-500" /> }
  ];

  // Testimonial data
  const testimonials = [
    {
      name: "Mustafa Mustafa",
      role: "High-School Student",
      image: "/testimonials/student2.jpg",
      feedback:
        "I have never been more productive. I used to always procrastinate, but now I can get things done so much faster.",
    },
    {
      name: "Sai Amartya B.L",
      role: "High-School Student",
      image: "/testimonials/student4.jpg",
      feedback:
        "I especially love the calendar integration. It's so convenient to have all my deadlines in one place.",
    },
    {
      name: "Dhairya Shah",
      role: "High-School Student",
      image: "/testimonials/student5.jpg",
      feedback:
        "Kai is so helpful. I used to always get distracted, but now I can stay on track and efficiently plan my study sessions with the help of Kai.",
    },
    {
      name: "Ishaan Dhiman",
      role: "High-School Student",
      image: "/testimonials/student2.jpg",
      feedback:
        "TidalTasks AI has revolutionized how I manage my study time. The smart scheduling and break reminders help me maintain focus and prevent burnout. I've seen a significant improvement in my productivity and academic performance.",
    },
  ];

  // Slides for the hero section
  const slides = [
    {
      image: "/dashboard-preview.png",
      alt: "TidalTasks Dashboard",
      title: "Smart Dashboard",
      description: "Everything you need to manage your academic life in one place"
    },
    {
      image: "/calendar-preview.png",
      alt: "TidalTasks Calendar Integration",
      title: "Calendar Integration",
      description: "Sync with Google Calendar to keep all your events organized"
    },
    {
      image: "/chatbot-preview.png",
      alt: "Kai - AI Assistant",
      title: "Meet Kai",
      description: "Your AI study companion to help you stay on track"
    },
    {
      image: "/analytics.png",
      alt: "TidalTasks Analytics Dashboard",
      title: "Analytics",
      description: "Track your progress and identify areas for improvement"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process the invite code
    alert(`Thank you for your interest! Your invite code ${inviteCode} has been submitted.`);
    setInviteCode("");
  };

  const handleKaiToggleSuggestions = (enabled: boolean) => {
    setKaiSuggestionsEnabled(enabled);
  };

  // YouTube embed for intelligent scheduling
  const YouTubeEmbed = ({ videoId }: { videoId: string }) => (
    <div className="relative overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {/* Responsive Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="TidalTasks Logo" 
                className="w-10 h-10 cursor-pointer" 
                loading="lazy" 
                onClick={() => navigate("/")}
              />
              {!isMobile && <span className="text-xl font-bold">TidalTasks AI</span>}
            </div>
            {/* Modified navigation for better mobile experience */}
            <div className={isMobile ? "hidden" : "hidden md:flex items-center space-x-8"}>
              <button 
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-foreground/90 hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-foreground/90 hover:text-primary transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => faqRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-foreground/90 hover:text-primary transition-colors"
              >
                FAQ
              </button>
            </div>
            {/* Mobile-optimized navigation menu */}
            <div className={!isMobile ? "hidden" : "md:hidden flex items-center space-x-4"}>
              <button 
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary"
              >
                Features
              </button>
              <button 
                onClick={() => faqRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary"
              >
                FAQ
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate("/login")}
                variant="outline" 
                size={isMobile ? "sm" : "default"}
                className="hidden sm:inline-flex"
              >
                Log In
              </Button>
              <Button 
                onClick={() => navigate("/signup")}
                size={isMobile ? "sm" : "default"}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Image Slider */}
        <section className="pt-32 pb-20 bg-gradient-to-b from-primary/10 via-background to-background relative overflow-hidden">
          {/* Animated Wave Background */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/20 to-transparent"></div>
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-64 bg-[url('/wave-pattern.svg')] bg-repeat-x bg-cover"
              animate={{ 
                x: [0, -100],
                transition: { 
                  repeat: Infinity, 
                  duration: 20,
                  ease: "linear"
                }
              }}
            />
            <motion.div 
              className="absolute bottom-10 left-0 right-0 h-64 bg-[url('/wave-pattern.svg')] bg-repeat-x bg-cover opacity-70"
              animate={{ 
                x: [-50, 50],
                transition: { 
                  repeat: Infinity, 
                  duration: 15,
                  ease: "linear",
                  repeatType: "reverse"
                }
              }}
            />
          </div>

          <motion.div
            className="container mx-auto px-6 text-center relative z-10"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
            >
              🚀 Currently in Beta • Limited Access
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Ride the Wave of Productivity
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your academic journey with TidalTasks AI—where intelligent scheduling meets personalized learning assistance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="text-lg px-8 group relative overflow-hidden" onClick={() => navigate("/register")}>
                <span className="relative z-10">Get Started</span>
                <motion.span 
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <ArrowRight className="ml-2 relative z-10" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/demo")}>
                Watch Demo
              </Button>
            </div>
            
            {/* Image Slider */}
            <div className="max-w-5xl mx-auto relative">
              <div className="relative aspect-video overflow-hidden rounded-xl shadow-2xl border border-border/40">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={slides[currentSlide].image}
                      alt={slides[currentSlide].alt}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white text-left">
                      <h3 className="text-xl font-bold">{slides[currentSlide].title}</h3>
                      <p>{slides[currentSlide].description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Slider Navigation */}
              <div className="absolute left-4 right-4 top-1/2 transform -translate-y-1/2 flex justify-between pointer-events-none">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full shadow-lg opacity-80 hover:opacity-100 pointer-events-auto"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full shadow-lg opacity-80 hover:opacity-100 pointer-events-auto"
                  onClick={nextSlide}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center mt-6 gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
              
            {/* Feature Highlights */}
            {!isMobile && <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <motion.span 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Clock className="w-4 h-4 text-primary" /> Smart Scheduling
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
              >
                <Calendar className="w-4 h-4 text-blue-500" /> Google Calendar Integration
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
              >
                <Bot className="w-4 h-4 text-indigo-500" /> AI Assistant Kai
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <BarChart2 className="w-4 h-4 text-purple-500" /> Productivity Analytics
              </motion.span>
            </div>}
          </motion.div>
        </section>

        {/* Features Section - Improved with clear differentiation */}
        <section className="py-20 bg-gradient-to-b from-background via-muted/50 to-background" ref={featuresRef}>
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Powerful Features
              </div>
              <h2 className="text-4xl font-bold mb-4">Powered by AI, Built for Students</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Experience the future of student productivity with our cutting-edge features designed to help you achieve academic excellence.
              </p>
            </motion.div>
            
            {/* Feature cards with clearer UI */}
            <div className="space-y-12 px-10 py-20 bg-muted/30">
              {/* Feature 1: Intelligent Scheduling */}
              <motion.div
                className="grid md:grid-cols-2 gap-8 items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="order-2 md:order-1">
                  <div className="inline-flex items-center gap-3 text-primary mb-4">
                    <Brain className="w-8 h-8" /> 
                    <h3 className="text-2xl font-bold">Intelligent Scheduling</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Our AI-powered scheduling adapts to your learning style and energy levels. It analyzes your productivity patterns and creates optimized study sessions to maximize your learning potential.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Personalized study plans based on your learning style</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Automatic breaks scheduled to prevent burnout</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Prioritizes tasks based on deadlines and difficulty</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-card p-4 rounded-xl shadow-lg border order-1 md:order-2">
                  <YouTubeEmbed videoId="pdXpseJq96c" />
                </div>
              </motion.div>

              <div className="h-5" />
              
              {/* Feature 2: Meet Kai with KaiFullInfo dialog */}
              <motion.div
                className={`grid md:grid-cols-2 gap-8 items-center ${isMobile ? "" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div 
                  className={`bg-card p-4 rounded-xl shadow-lg border border-indigo-200/50 hover:border-indigo-400 hover:shadow-xl cursor-pointer ${isMobile ? "order-1" : ""}`}
                  onClick={() => setShowKaiDialog(true)}
                >
                  <img 
                    src="/chatbot-preview.png" 
                    alt="Kai - AI Assistant" 
                    className="rounded-lg w-full shadow-sm" 
                    loading="lazy"
                  />
                  {/* Subtle indicator that this is clickable */}
                  <div className="text-center text-xs text-muted-foreground mt-2 opacity-70">Click to meet Kai</div>
                </div>
                <div className={`${isMobile ? "order-2" : ""}`}>
                  <div className="inline-flex items-center gap-3 text-indigo-500 mb-4">
                    <Bot className="w-8 h-8" /> 
                    <h3 className="text-2xl font-bold">
                      <span 
                        className="cursor-pointer hover:text-indigo-600" 
                        onClick={() => setShowKaiDialog(true)}
                      >
                        Meet Kai
                      </span>
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Kai is your AI study companion that helps you stay on track and motivated. Ask questions about your schedule, get study tips, or simply chat when you need a break.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                      <span>Provides personalized study recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                      <span>Helps you manage your time efficiently</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                      <span>Offers motivation when you need it most</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              <div className="h-5" />
              
              {/* Feature 3: Calendar Integration */}
              <motion.div
                className="grid md:grid-cols-2 gap-8 items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="order-2 md:order-1">
                  <div className="inline-flex items-center gap-3 text-blue-500 mb-4">
                    <Calendar className="w-8 h-8" /> 
                    <h3 className="text-2xl font-bold">Calendar Integration</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Seamlessly sync with Google Calendar to keep all your events and deadlines in one place. No more switching between multiple apps to manage your schedule.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Two-way sync with Google Calendar</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Automated reminders for upcoming deadlines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Visual timeline of all your academic commitments</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-card p-4 rounded-xl shadow-lg border order-1 md:order-2">
                  <img 
                    src="/calendar-preview.png" 
                    alt="Calendar Integration" 
                    className="rounded-lg w-full shadow-sm" 
                    loading="lazy"
                  />
                </div>
              </motion.div>

              <div className="h-5" />
              
              {/* Feature 4: Analytics Dashboard */}
              <motion.div
                className="grid md:grid-cols-2 gap-8 items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-card p-4 rounded-xl shadow-lg border">
                  <img 
                    src="/analytics.png" 
                    alt="Analytics Dashboard" 
                    className="rounded-lg w-full shadow-sm" 
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-3 text-purple-500 mb-4">
                    <BarChart2 className="w-8 h-8" /> 
                    <h3 className="text-2xl font-bold">Analytics Dashboard</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Track your progress and identify areas for improvement with our comprehensive analytics dashboard. Get valuable insights into your study habits and productivity.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                      <span>Visualize your productivity trends over time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                      <span>Identify your peak productivity hours</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                      <span>Get recommendations for improving study habits</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
            
            {/* Other features grid - for secondary features */}
            <div className="grid md:grid-cols-2 gap-8 mt-16 py-20 px-10 bg-muted/30">
              {/* Smart Study Sessions */}
              <motion.div
                className="bg-card p-6 rounded-xl shadow-sm border border-green-100/50 hover:border-green-200 group transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:text-green-500">
                  <Clock className="w-12 h-12 text-green-500" aria-label="Smart Study Sessions Icon" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Study Sessions</h3>
                <p className="text-muted-foreground">Optimized study sessions with built-in breaks and focus tracking to help you maintain concentration and prevent burnout.</p>
              </motion.div>
              
              {/* AI Insights */}
              <motion.div
                className="bg-card p-6 rounded-xl shadow-sm border border-yellow-100/50 hover:border-yellow-200 group transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:text-yellow-500">
                  <Sparkles className="w-12 h-12 text-yellow-500" aria-label="AI Insights Icon" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Insights</h3>
                <p className="text-muted-foreground">Get personalized recommendations to boost your productivity based on your unique study patterns and performance data.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-muted/30" ref={howItWorksRef}>
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Simple Process
              </div>
              <h2 className="text-4xl font-bold mb-4">How TidalTasks Works</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Getting started with TidalTasks is easy. Follow these simple steps to transform your study routine.
              </p>
            </motion.div>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform -translate-y-1/2 hidden md:block"></div>
              
              <div className="grid md:grid-cols-4 gap-8 relative z-10">
                {howItWorks.map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-background flex items-center justify-center shadow-md mb-6 relative"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                      <span className="relative z-10">{step.icon}</span>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits/Stats Section */}
        <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Real Results
              </div>
              <h2 className="text-4xl font-bold mb-4">See the Difference</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Our beta testers have experienced significant improvements in productivity and academic performance.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-sm border text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-center mb-4">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Button 
                size="lg" 
                className="text-lg px-8" 
                onClick={() => navigate("/register")}
              >
                Join the Beta <ArrowRight className="ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Testimonials
              </div>
              <h2 className="text-4xl font-bold mb-4">Student Success Stories</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Hear from students who have transformed their academic journey with TidalTasks AI.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-sm border relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="absolute -top-5 -left-2 text-5xl text-primary/20">"</div>
                  <p className="text-muted-foreground mb-6 relative z-10">{testimonial.feedback}</p>
                  <div className="flex items-center mt-auto">
                    <img
                      src={testimonial.image}
                      alt={`${testimonial.name}'s picture`}
                      className="w-12 h-12 rounded-full mr-4 border-2 border-primary/20"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30" ref={faqRef}>
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                FAQ
              </div>
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Get answers to the most common questions about TidalTasks AI.
              </p>
            </motion.div>
            
            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.button
                    className={`w-full text-left p-5 rounded-lg flex justify-between items-center ${
                      activeAccordion === index 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-card hover:bg-muted/80'
                    } transition-colors duration-200 border`}
                    onClick={() => toggleAccordion(index)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="font-medium text-lg">{faq.question}</span>
                    {activeAccordion === index ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0" />
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {activeAccordion === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-muted/30 rounded-b-lg border-x border-b">
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Beta Access Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <div className="inline-block mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                      Limited Access
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Join Our Beta Program</h2>
                    <p className="text-muted-foreground mb-6">
                      TidalTasks AI is currently in beta testing. Enter your invite code to get early access and help shape the future of student productivity.
                    </p>
                    
                    <form onSubmit={handleInviteSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">
                          Invite Code
                        </label>
                        <input
                          type="text"
                          id="inviteCode"
                          placeholder="Enter your invite code"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Get Started
                      </Button>
                    </form>
                    
                    <div className="mt-6 text-sm text-muted-foreground">
                      <p>Don't have an invite code? <a href="https://discord.gg/CQgJBgADdM" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join our Discord</a> to request one.</p>
                    </div>
                  </motion.div>
                </div>
                
                <div className="relative hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80"></div>
                  <div className="absolute inset-0 bg-[url('/wave-pattern.svg')] bg-cover opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-white text-center">
                      <Bot className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Meet Kai</h3>
                      <p className="opacity-90">
                        Your personal AI study companion, ready to help you achieve your academic goals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Academic Journey?</h2>
              <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
                Join the growing community of students using TidalTasks AI to excel in their studies and achieve academic success.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-transparent text-white hover:bg-white/10"
                  onClick={() => scrollToSection(featuresRef)}
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="TidalTasks AI Logo" 
                  className="h-8" 
                  loading="lazy" 
                />
                <h3 className="font-semibold">TidalTasks AI</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students with AI-driven productivity tools to achieve academic excellence.
              </p>
              <div className="flex space-x-4 mt-4">
                <a
                  href="https://discord.gg/CQgJBgADdM"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="hover:text-primary transition-colors"
                >
                  <DiscordIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/tidaltasks_ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-primary transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@tidaltasks.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="hover:text-primary transition-colors"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://www.youtube.com/@TidalTasksAi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="hover:text-primary transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    className="hover:text-primary transition-colors"
                    onClick={() => scrollToSection(featuresRef)}
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    className="hover:text-primary transition-colors"
                    onClick={() => scrollToSection(howItWorksRef)}
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button 
                    className="hover:text-primary transition-colors"
                    onClick={() => scrollToSection(faqRef)}
                  >
                    FAQ
                  </button>
                </li>
                <li>Pricing</li>
                <li>Roadmap</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>Blog</li>
                <li>Careers</li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a 
                    href="https://discord.gg/CQgJBgADdM" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Discord Community
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:support@tidaltasks.ai"
                    className="hover:text-primary transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>Help Center</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p> 2025 TidalTasks AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Kai Dialog */}
      <KaiFullInfo 
        suggestionsEnabled={kaiSuggestionsEnabled}
        onToggleSuggestions={handleKaiToggleSuggestions}
        isOpen={showKaiDialog}
        onOpenChange={setShowKaiDialog}
      />
    </div>
  );
}
