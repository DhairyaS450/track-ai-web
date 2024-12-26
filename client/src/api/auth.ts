import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/config/firebase";

// Login
// POST /auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, user: UserCredential }
export const login = async (email: string, password: string) => {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then((userCredential) => {
      return { success: true, user: userCredential };
    })
    .catch((error) => {
      console.error("Error during login:", error);
    });
};

// Register
// POST /auth/register
// Request: { email: string, password: string }
// Response: { success: boolean, user: UserCredential }
export const register = async (data: { email: string; password: string }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    return { success: true, user: userCredential };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
};
