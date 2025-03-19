import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from "@/api/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('AuthProvider');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (!response.success) {
      throw new Error('Login failed');
    }
  };

  const register = async (email: string, password: string, inviteCode: string) => {
    const response = await apiRegister({ email, password, inviteCode });
    if (!response.success) {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    await apiLogout();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}