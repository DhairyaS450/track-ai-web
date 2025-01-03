import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Layout } from "./components/Layout"
import { Dashboard } from "./pages/Dashboard"
import { Calendar } from "./pages/Calendar"
import { StudySessions } from "./pages/StudySessions"
import { Analytics } from "./pages/Analytics"
import { Settings } from "./pages/Settings"
import { Chatbot } from "./pages/Chatbot"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import api from "./api/Api"
import { EmailVerification } from "./pages/EmailVerification"

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is logged in:', user.email);
        setUser(user);

        // Refresh the user's token
        user.getIdToken().then((token) => {
          console.log('User token:', token);

          // Set the token in the Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }).catch((error) => {
          console.error('Error refreshing user token:', error);
        });
      } else {
        console.log('User is logged out');
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
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<EmailVerification user={user} />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="study" element={<StudySessions />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="chatbot" element={<Chatbot />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App