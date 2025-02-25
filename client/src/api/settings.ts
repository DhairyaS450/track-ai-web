/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, getDoc, onSnapshot, setDoc } from "@firebase/firestore"
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
  updates: {
    userProfile?: any;
    timeConstraints?: any;
  },
  preferences: any = {}
) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw Error("Cannot get userId for settings update");
  }

  const userDocRef = doc(db, "users", userId);
  console.log("Saving settings:", updates, preferences);

  try {
    // Retrieve existing settings
    const snapshot = await getDoc(userDocRef);
    const existingData = snapshot.exists() ? snapshot.data() : {};

    // Create the update object
    const updatedData = {
      ...existingData,
      // Update userProfile if provided
      ...(updates.userProfile ? { userProfile: updates.userProfile } : {}),
      // Update timeConstraints if provided
      ...(updates.timeConstraints ? { timeConstraints: updates.timeConstraints } : {}),
      // Update preferences if provided
      ...(Object.keys(preferences).length > 0 ? {
        preferences: {
          ...existingData.preferences,
          ...preferences
        }
      } : {})
    };

    // Save the updated settings
    await setDoc(userDocRef, updatedData);
    console.log("Settings updated successfully:", updatedData);
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw Error("Cannot get userId for settings update");
  }
  const userDocRef = doc(db, "users", userId);
  const snapshot = await getDoc(userDocRef);
  const userProfile = snapshot.exists() ? snapshot.data().userProfile : {};
  const timeConstraints = snapshot.exists() ? snapshot.data().timeConstraints : [];
  return { userProfile, timeConstraints };
};

