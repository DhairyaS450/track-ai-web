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
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="study" element={<StudySessions />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App