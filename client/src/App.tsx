import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Calendar } from "./pages/Calendar";
import { StudySessions } from "./pages/StudySessions";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Chatbot } from "./pages/Chatbot";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import api from "./api/Api";
import { EmailVerification } from "./pages/EmailVerification";
import { DataProvider } from "@/contexts/DataProvider";
import { Home } from "./pages/Home";
import { Privacy } from "./pages/Privacy";
import { TOS } from "./pages/TOS";
import { About } from "./pages/About";
import DemoPage from './pages/DemoPage';
import { NotFound } from "./pages/NotFound";
import { Unauthorized } from "./pages/Unauthorized";
import { Spinner } from "./components/ui/spinner";
import { ActionVisualizationProvider } from "./contexts/ActionVisualizationProvider";

function App() {
  console.log("App");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user.email);
        setUser(user);

        // Refresh the user's token
        user
          .getIdToken()
          .then((token) => {
            console.log("User token:", token);

            // Set the token in the Authorization header
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          })
          .catch((error) => {
            console.error("Error refreshing user token:", error);
          });
      } else {
        console.log("User is logged out");
        setUser(null);
      }

      setLoading(false); // Mark loading as complete
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <DataProvider>
        <ActionVisualizationProvider>
          <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <Router>
              <Routes>
                {/* Public Marketing Homepage */}
                <Route path="/" element={<Home />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms-of-service" element={<TOS />} />
                <Route path="/about" element={<About />} />

                {/* Public routes for auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route
                  path="/verify-email"
                  element={<EmailVerification user={user} />}
                />
                {/* abviously this is a demo page so it should be public */}
                <Route path="demo" element={<DemoPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="study" element={<StudySessions />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="chatbot" element={<Chatbot />} />
                </Route>

                {/* 404 Not Found - must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </Router>
          </ThemeProvider>
        </ActionVisualizationProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
