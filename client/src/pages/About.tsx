import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function About() {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "Dhairya Shah",
      role: "CEO",
      initials: "DS",
      description: "Passionate programmer and the creator of TidalTasks AI. Student with a focus on building innovative solutions.",
      website: "https://www.dhairyashah.work/"
    },
    {
      name: "Ishaan Dhiman",
      role: "CTO",
      initials: "ID",
      description: "Student and passionate programmer with experience in React, Next.js, and Tailwind CSS.",
      website: "https://ishaan-dhiman.vercel.app/"
    },
    {
      name: "Mustafa Mustafa",
      role: "COO",
      initials: "MM",
      description: "Student with a passion for technology and problem-solving.",
      website: ""
    },
    {
      name: "Sai Amartya B.L.",
      role: "CMO",
      initials: "SA",
      description: "Student and passionate programmer with a focus on AI and neural networks.",
      website: "https://saiamartya.vercel.app/"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">About Us</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Our Team</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Meet the passionate students behind TidalTasks AI, working together to create innovative tools for academic excellence.
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {teamMembers.map((member, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="overflow-hidden border-primary/10 hover:border-primary/30 transition-colors duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{member.name}</h3>
                        <Badge variant="outline" className="mt-1 font-normal">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{member.description}</p>
                    {member.website && (
                      <a 
                        href={member.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Personal Website
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
} 