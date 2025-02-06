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
    return <div>Loading...</div>;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <Router>
            <Routes>
              {/* Public Marketing Homepage */}
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms-of-service" element={<TOS />} />

              {/* Public routes for auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/verify-email"
                element={<EmailVerification user={user} />}
              />
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
            </Routes>
            <Toaster />
          </Router>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
