import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WelcomeSlideProps {
  onNext: () => void;
}

export function WelcomeSlide({ onNext }: WelcomeSlideProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* App Logo */}
      <div className="mb-4">
        <img 
          src="/logo.png" 
          alt="TidalTasks Logo" 
          className="w-32 h-32" 
        />
      </div>
      
      {/* Tagline */}
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
        Welcome to TidalTasks
      </h1>
      
      {/* Short intro */}
      <p className="text-lg text-muted-foreground max-w-2xl">
        Your personalized AI-powered study companion. Let's set up your profile and preferences to create a custom experience tailored to your academic journey.
      </p>
      
      {/* Optional: video or animation */}
      {/* <div className="w-full max-w-xl rounded-lg overflow-hidden shadow-xl my-8">
        <video 
          className="w-full" 
          autoPlay 
          muted 
          loop
          poster="/welcome-poster.png"
        >
          <source src="/welcome-animation.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div> */}
      
      {/* Get Started Button */}
      <Button 
        size="lg" 
        className="text-lg px-8 mt-8"
        onClick={onNext}
      >
        Get Started
      </Button>
    </motion.div>
  );
} 