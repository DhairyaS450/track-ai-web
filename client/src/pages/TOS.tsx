import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import termsOfService from "../../../TOS.md?raw"

export function TOS() {
  const navigate = useNavigate();


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
            <h1 className="text-xl font-semibold">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-24">
        <div className="prose prose-gray dark:prose-invert max-w-4xl mx-auto">
          <Markdown>{termsOfService}</Markdown>
        </div>
      </main>


    </div>
  );
} 