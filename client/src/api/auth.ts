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
  deleteUser,
  getAuth,
} from "firebase/auth";
import { db, auth } from "@/config/firebase";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, getDoc, deleteDoc } from "@firebase/firestore";

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
      return { success: true, user: userCredential, error: null };
    })
    .catch((error) => {
      console.error("Error during login:", error);
      return { success: false, error: error.message };
    });

  return response;
};

// Register
// POST /auth/register
// Request: { email: string, password: string, inviteCode: string }
// Response: { success: boolean, user: UserCredential }
export const register = async (data: { email: string; password: string; inviteCode: string }) => {
  try {
    // First create the user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Add user to database
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
    });

    // Now validate and mark the invite code as used
    const inviteCodesRef = collection(db, "inviteCodes");
    const q = query(inviteCodesRef, where("code", "==", data.inviteCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const inviteCodeDoc = querySnapshot.docs[0];
    const inviteCodeData = inviteCodeDoc.data();

    if (inviteCodeData.used) {
      // If invite code is already used, delete the user and throw error
      await userCredential.user.delete();
      throw new Error("This invite code has already been used");
    }

    // Mark invite code as used
    await updateDoc(doc(db, "inviteCodes", inviteCodeDoc.id), {
      used: true,
      usedBy: userCredential.user.uid,
      usedAt: new Date()
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

// Delete Current User Account
export const deleteCurrentUserAccount = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently signed in.");
  }

  try {
    await deleteUser(user);
    console.log("Successfully deleted user account from Firebase Auth.");
    
    // Delete user data from Firestore
    const userDoc = doc(db, "users", user.uid);
    await deleteDoc(userDoc);
    console.log("Successfully deleted user data from Firestore.");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    // Handle specific errors like 'auth/requires-recent-login'
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("This operation is sensitive and requires recent authentication. Please log out and log back in before retrying.");
    } 
    throw new Error(`Failed to delete user account: ${error.message}`);
  }
};

// Verify Email
export const verifyEmail = async (user: User | null) =>  { 
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
export const signInWithGoogle = async (inviteCode?: string) => {
  try {
    // Proceed with Google sign in
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is a new user by checking if they exist in our database
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    
    if (!userDoc.exists()) {
      // This is a new user, validate invite code
      if (!inviteCode) {
        throw new Error("Invite code is required for new users");
      }

      // Validate the invite code
      const inviteCodesRef = collection(db, "inviteCodes");
      const q = query(inviteCodesRef, where("code", "==", inviteCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("Invalid invite code");
      }

      const inviteCodeDoc = querySnapshot.docs[0];
      const inviteCodeData = inviteCodeDoc.data();

      if (inviteCodeData.used) {
        throw new Error("This invite code has already been used");
      }

      // Mark invite code as used
      await updateDoc(doc(db, "inviteCodes", inviteCodeDoc.id), {
        used: true,
        usedBy: result.user.uid,
        usedAt: new Date()
      });
    }
    
    // Add/update user in database
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