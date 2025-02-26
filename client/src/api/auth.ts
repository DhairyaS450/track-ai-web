/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db, auth } from "@/config/firebase";
import { doc, setDoc} from "@firebase/firestore";

// Login
// POST /auth/login
// Request: { email: string, password: string }
// Response: { success: boolean, user: UserCredential }
export const login = async (email: string, password: string) => {
  const response = await setPersistence(auth, browserLocalPersistence)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then((userCredential) => {
      return { success: true, user: userCredential };
    })
    .catch((error) => {
      console.error("Error during login:", error);
      return { success: false, error: error.message };
    });

  return response;
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

    // Add user to database
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
    });

    // Verify the email
    await verifyEmail(userCredential.user);

    return {
      success: true,
      user: userCredential,
    };
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


// Verify Email
// POST /auth/verify-email
// Request: { email: string }
// Response: { success: boolean }
export const verifyEmail = async (user: User | null) => { 
  try {
    if (!user) {
      throw new Error("User not found");
    }
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    console.error("Error during email verification:", error);
    throw new Error(error.message);
  }
}

// Add Google Sign In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Add user to database if they don't exist
    await setDoc(doc(db, "users", result.user.uid), {
      email: result.user.email,
      name: result.user.displayName,
      photoURL: result.user.photoURL,
    }, { merge: true }); // merge: true will only update specified fields

    return { success: true, user: result };
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw new Error(error.message);
  }
};