import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function Unauthorized() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header>
        <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="/logo.png" 
                  alt="TaskTide Logo" 
                  onClick={() => navigate("/")} 
                  className="h-8 cursor-pointer" 
                  loading="lazy" 
                />
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

      {/* Main content */}
      <main className="container mx-auto px-6 pt-32 flex flex-col items-center justify-center h-screen">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You need to be logged in to view this page. Please log in or create an account to continue.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button variant="outline" onClick={() => navigate("/register")}>
              Sign Up
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 