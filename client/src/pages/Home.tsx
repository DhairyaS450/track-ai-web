import { Button } from "@/components/ui/button";
import {
  Calendar,
  BarChart2,
  Clock,
  Bot,
  Brain,
  Sparkles,
  ArrowRight,
  Github,
  Twitter,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  // Shared fade-in animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Feature data for the grid
  const features = [
    {
      icon: <Brain className="w-12 h-12 text-primary" aria-label="Intelligent Scheduling Icon" />,
      title: "Intelligent Scheduling",
      description: "AI-powered scheduling that adapts to your learning style and energy levels.",
    },
    {
      icon: <Bot className="w-12 h-12 text-indigo-500" aria-label="Meet Kai Icon" />,
      title: "Meet Kai",
      description: "Your AI study companion that helps you stay on track and motivated.",
    },
    {
      icon: <Calendar className="w-12 h-12 text-blue-500" aria-label="Calendar Integration Icon" />,
      title: "Calendar Integration",
      description: "Seamlessly sync with Google Calendar to keep all your events in one place.",
    },
    {
      icon: <Clock className="w-12 h-12 text-green-500" aria-label="Smart Study Sessions Icon" />,
      title: "Smart Study Sessions",
      description: "Optimized study sessions with built-in breaks and focus tracking.",
    },
    {
      icon: <BarChart2 className="w-12 h-12 text-purple-500" aria-label="Analytics Dashboard Icon" />,
      title: "Analytics Dashboard",
      description: "Track your progress and identify areas for improvement.",
    },
    {
      icon: <Sparkles className="w-12 h-12 text-yellow-500" aria-label="AI Insights Icon" />,
      title: "AI Insights",
      description: "Get personalized recommendations to boost your productivity.",
    },
  ];

  // Testimonial data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Major",
      image: "/testimonials/student1.jpg",
      feedback:
        "TaskTide AI has completely transformed how I manage my studies. The AI recommendations are spot-on, and I love how it adapts to my schedule.",
    },
    {
      name: "Lucas Smith",
      role: "High-School Student",
      image: "/testimonials/student2.jpg",
      feedback:
        "I have never been more productive. I used to always procrastinate, but now I can get things done so much faster.",
    },
    {
      name: "Emily Davis",
      role: "Business Student",
      image: "/testimonials/student3.jpg",
      feedback:
        "The scheduling feature has saved me countless hours. A must-have for any student!",
    },
    {
      name: "Mustafa Mustafa",
      role: "University Student",
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
  ];


  return (
    <div className="min-h-screen">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>

      {/* Navbar */}
      <header>
        <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src="/logo.png" alt="TaskTide Logo" className="h-8" loading="lazy" />
                <span className="text-xl font-bold">TaskTide AI</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>Get Started</Button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-gradient-to-b from-primary/10 via-background to-background">
          <motion.div
            className="container mx-auto px-6 text-center"
            initial="initial"
            animate="animate"
            variants={fadeIn}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Ride the Wave of Productivity
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your academic journey with TaskTide AI—where intelligent scheduling meets personalized learning assistance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate("/register")}>
                Start Free Trial <ArrowRight className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/demo")}>
                Watch Demo
              </Button>
            </div>
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative mx-auto max-w-6xl">
                {/* Main Dashboard Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative z-10 transition-all duration-500 ease-out cursor-pointer group"
                >
                  <img
                    src="/dashboard-preview.png"
                    alt="TaskTide Dashboard Preview"
                    className="rounded-xl shadow-2xl border border-border/40 w-full transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 group-hover:scale-[1.02] group-hover:z-30"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
                </motion.div>
                
                {/* Floating Elements */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -left-8 top-1/4 w-64 hidden lg:block cursor-pointer group"
                >
                  <img
                    src="/mobile-preview.png"
                    alt="TaskTide Mobile View"
                    className="rounded-lg shadow-xl border border-border/40 transform -rotate-6 transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 group-hover:scale-110 group-hover:z-30"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 transform -rotate-6" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -right-8 top-1/3 w-72 hidden lg:block cursor-pointer group"
                >
                  <img
                    src="/calendar-preview.png"
                    alt="TaskTide Calendar View"
                    className="rounded-lg shadow-xl border border-border/40 transform rotate-6 transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 group-hover:scale-110 group-hover:z-30"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 transform rotate-6" />
                </motion.div>
                
                {/* Decorative Elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl rounded-full" />
                <div className="absolute inset-0 -z-20 bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-3xl transition-opacity duration-300 group-hover:opacity-70" />
              </div>
              
              {/* Browser Frame Mockup - Optional */}
              <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Real-time Updates
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Smart Calendar
                </span>
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4" /> AI Assistant
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gradient-to-b from-background via-muted/50 to-background">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">Powered by AI, Built for Students</h2>
              <p className="text-muted-foreground text-lg">
                Experience the future of student productivity with our cutting-edge features.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Trusted by High-School and University Students Worldwide
              </h2>
              <div className="flex flex-wrap justify-center gap-8 opacity-70">
                <img
                  src="/university-logos/harvard.png"
                  alt="Harvard University Logo"
                  className="h-12"
                  loading="lazy"
                />
                <img
                  src="/university-logos/stanford.png"
                  alt="Stanford University Logo"
                  className="h-12"
                  loading="lazy"
                />
                <img
                  src="/university-logos/mit.png"
                  alt="MIT Logo"
                  className="h-12"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Student Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-sm border"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.image}
                      alt={`${testimonial.name}'s picture`}
                      className="w-12 h-12 rounded-full mr-4"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"{testimonial.feedback}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Academic Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students already using TaskTide AI to excel in their studies.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/register")}
            >
              Start Free Trial
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">TaskTide AI</h3>
              <p className="text-sm text-muted-foreground">
                Empowering students with AI-driven productivity tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Roadmap</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="mailto:info@tasktide.ai" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 TaskTide AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
