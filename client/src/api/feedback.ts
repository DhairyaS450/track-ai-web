/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, auth } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackData {
  rating: number;
  feedback: string;
}

export const submitFeedback = async (data: FeedbackData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to submit feedback');
    }

    const feedbackData = {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      status: 'new',
      platform: 'web'
    };

    const docRef = await addDoc(collection(db, 'feedback'), feedbackData);
    console.log('Feedback submitted with ID:', docRef.id);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
};
