// client/src/api/conflicts.ts

// TODO: Adjust this import based on your actual firebase config path
import { db, auth } from '@/config/firebase'; 
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    Timestamp, 
    and 
} from 'firebase/firestore';
import { SchedulableItem, ItemType } from '@/types/unified';
import { ChatbotAction } from './chatbot'; // Assuming ChatbotAction is exported here

export type ResolutionType = 'ignored' | 'ai_applied' | 'rescheduled' | 'deleted';

// Interface for storing resolution records
export interface ConflictResolution {
    id: string; // Composite ID: userId_item1Id_item2Id (sorted)
    userId: string;
    item1Id: string;
    item1Type: ItemType;
    item2Id: string;
    item2Type: ItemType;
    resolvedAt: Timestamp;
    resolutionType: ResolutionType;
    suggestionText?: string; // Optional: Store suggestion if AI applied it
    suggestionAction?: ChatbotAction; // Optional: Store action if AI applied it
}

// Interface for storing AI suggestions (can be separate or part of resolution)
// Using a separate collection might be cleaner if suggestions are fetched before resolution
export interface SavedConflictSuggestion {
    id: string; // Composite ID: userId_item1Id_item2Id (sorted)
    userId: string;
    item1Id: string;
    item1Type: ItemType;
    item2Id: string;
    item2Type: ItemType;
    suggestion: string;
    action: ChatbotAction | null;
    createdAt: Timestamp;
    error?: string; // Store potential errors from the AI
}

// --- Helper Function ---
function getConflictDocId(userId: string, item1Id: string, item2Id: string): string {
    // Sort IDs to ensure consistency regardless of item order
    const sortedIds = [item1Id, item2Id].sort();
    return `${userId}_${sortedIds[0]}_${sortedIds[1]}`;
}

// --- Firestore Functions ---

/**
 * Saves a record of how a conflict was resolved.
 */
export async function saveConflictResolution(
    userId: string,
    item1: SchedulableItem,
    item2: SchedulableItem,
    resolutionType: ResolutionType,
    suggestionText?: string,
    suggestionAction?: ChatbotAction
): Promise<void> {
    if (!userId || !item1?.id || !item2?.id || !item1?.itemType || !item2?.itemType) {
        throw new Error("Missing required data to save conflict resolution.");
    }

    const docId = getConflictDocId(userId, item1.id, item2.id);
    const resolutionRef = doc(db, 'conflictResolutions', docId);

    const resolutionData: Omit<ConflictResolution, 'id'> = { // Omit id as it's the doc name
        userId,
        item1Id: item1.id,
        item1Type: item1.itemType,
        item2Id: item2.id,
        item2Type: item2.itemType,
        resolvedAt: Timestamp.now(),
        resolutionType,
        ...(suggestionText && { suggestionText }), // Add suggestion if provided
        ...(suggestionAction && { suggestionAction }), // Add action if provided
    };

    try {
        await setDoc(resolutionRef, resolutionData, { merge: true }); // Use merge to update if exists
        console.log(`Conflict resolution saved for ${docId} as ${resolutionType}`);
    } catch (error) {
        console.error("Error saving conflict resolution:", error);
        throw new Error("Failed to save conflict resolution to database.");
    }
}

/**
 * Fetches conflicts marked as 'ignored' by the user.
 * Returns a Set of composite IDs for easy lookup.
 */
export async function getIgnoredConflicts(userId: string): Promise<Set<string>> {
    if (!userId) {
        console.warn("User ID is required to fetch ignored conflicts.");
        return new Set();
    }

    const ignoredConflicts = new Set<string>();
    const resolutionsRef = collection(db, 'conflictResolutions');
    const q = query(resolutionsRef, 
        where('userId', '==', userId), 
        where('resolutionType', '==', 'ignored')
    );

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // The document ID itself is the composite key we need
            ignoredConflicts.add(doc.id); 
        });
        console.log(`Fetched ${ignoredConflicts.size} ignored conflicts for user ${userId}`);
    } catch (error) {
        console.error("Error fetching ignored conflicts:", error);
        // Decide how to handle errors - maybe return empty set or throw?
        // Returning empty set might be safer for UI rendering.
    }
    return ignoredConflicts;
}

/**
 * Saves an AI-generated suggestion for a specific conflict pair.
 */
export async function saveAiSuggestion(
    userId: string,
    item1: SchedulableItem,
    item2: SchedulableItem,
    suggestion: string,
    action: ChatbotAction | null,
    error?: string
): Promise<void> {
     if (!userId || !item1?.id || !item2?.id || !item1?.itemType || !item2?.itemType) {
        throw new Error("Missing required data to save AI suggestion.");
    }
    
    const docId = getConflictDocId(userId, item1.id, item2.id);
    const suggestionRef = doc(db, 'conflictSuggestions', docId);

    const suggestionData: Omit<SavedConflictSuggestion, 'id'> = {
        userId,
        item1Id: item1.id,
        item1Type: item1.itemType,
        item2Id: item2.id,
        item2Type: item2.itemType,
        suggestion,
        action,
        createdAt: Timestamp.now(),
        ...(error && { error }),
    };

    try {
        await setDoc(suggestionRef, suggestionData, { merge: true }); // Overwrite/update if exists
        console.log(`AI suggestion saved for ${docId}`);
    } catch (dbError) {
        console.error("Error saving AI suggestion:", dbError);
        throw new Error("Failed to save AI suggestion to database.");
    }
}

/**
 * Fetches a previously saved AI suggestion for a specific conflict pair.
 */
export async function getSavedAiSuggestion(
    userId: string,
    item1Id: string,
    item2Id: string
): Promise<SavedConflictSuggestion | null> {
     if (!userId || !item1Id || !item2Id ) {
        console.warn("Missing required data to fetch saved AI suggestion.");
        return null;
    }

    const docId = getConflictDocId(userId, item1Id, item2Id);
    const suggestionRef = doc(db, 'conflictSuggestions', docId);

    try {
        const docSnap = await getDoc(suggestionRef);
        if (docSnap.exists()) {
            console.log(`Found saved AI suggestion for ${docId}`);
            // Add the id back into the object
            return { id: docSnap.id, ...docSnap.data() } as SavedConflictSuggestion;
        } else {
            console.log(`No saved AI suggestion found for ${docId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching saved AI suggestion:", error);
        return null; // Return null on error to allow fetching fresh suggestion
    }
}

// Helper to generate the composite ID for checking ignored status
export function getConflictCheckId(item1Id: string, item2Id: string, userId: string): string {
     if (!userId || !item1Id || !item2Id) return '';
     const sortedIds = [item1Id, item2Id].sort();
     return `${userId}_${sortedIds[0]}_${sortedIds[1]}`;
} 