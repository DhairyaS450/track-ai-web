import { doc, onSnapshot, setDoc } from "@firebase/firestore"
import { db, auth } from "@/config/firebase"

// Function to listen for updates in the user's Firestore document
export const listenToSettings = (onUpdate: (data: any) => void) => {
    const userId = auth.currentUser?.uid
    let userDocRef;
    if (userId) {
        userDocRef = doc(db, "users", userId)
    } else {
        throw Error('Cannot get userId for settings update')
    }
    
    return onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            onUpdate(data);
        } else {
            console.warn("No user document found!")
        }
    })
}

export const saveSettings = async (
    userProfile: any,
    preferences: any
  ) => {
    const userId = auth.currentUser?.uid
    let userDocRef
    if (userId) {
        userDocRef = doc(db, "users", userId);
    } else {
        throw Error('Cannot get userId for settings update')
    }
  
    try {
      await setDoc(
        userDocRef,
        {
          userProfile,
          preferences,
        },
        { merge: true } // Merge updates without overwriting the entire document
      );
      console.log("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  