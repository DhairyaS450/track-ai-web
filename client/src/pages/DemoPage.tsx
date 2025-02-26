import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DemoPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      {/*
      Header was copy-pasted from the home page
      We should probably make a seperate component for this
      TODO: Make a header component
      */}
      <header>
        <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src="/logo.png" alt="TaskTide Logo" onClick={() => navigate("/")} className="h-8 cursor-pointer" loading="lazy" />
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
        <center>
          <div>
            {/* So that the text is not hidden */}
            <br>
            </br>
            <br>
            </br>
            <br>
            </br>
            <br>
            </br>

            {/* Actual content */}
            <h1>Demo Coming Soon</h1>
            <span>Check back soon for a demo of TaskTide AI</span>
          </div>
        </center>
      </main>
    </div>
  );
};

export default DemoPage;
