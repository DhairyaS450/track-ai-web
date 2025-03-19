
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env'});

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.env.VITE_FIREBASE_EMAIL;
const password = process.env.VITE_FIREBASE_PASSWORD;

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateAndStoreInviteCodes(count = 1) {
  try {
    const inviteCodesCollection = collection(db, 'inviteCodes');
    
    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();
      await addDoc(inviteCodesCollection, {
        code,
        createdAt: new Date(),
        used: false,
        usedBy: null,
        usedAt: null
      });
      console.log(`Generated invite code: ${code}`);
    }
    
    console.log(`Successfully generated ${count} invite code(s)`);
  } catch (error) {
    console.error('Error generating invite codes:', error);
  }
}

// Generate 5 invite codes by default
async function main() {
  await signInWithEmailAndPassword(auth, email, password)
  .then(() => {
    console.log('Signed in successfully');
  })
  .catch((error) => {
    console.error('Error signing in:', error);
  });
  await generateAndStoreInviteCodes(5);
}

main();