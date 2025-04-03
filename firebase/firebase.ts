// firebase.ts
import { initializeApp, getApp } from "firebase/app"; // Import getApp
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Add doc and setDoc
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // Add this line here

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (conditionally)
let app;
try {
  app = getApp(); // Check if an app is already initialized
} catch (e: any) {
  app = initializeApp(firebaseConfig); // If not, initialize
}

// Initialize Firebase Services (conditionally)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // Add this line here

// Define the createUserProfile function
export const createUserProfile = async (user: any) => {
  const userRef = doc(db, "users", user.uid); // Create a reference to the user's profile in Firestore
  await setDoc(userRef, {
    displayName: user.displayName,
    email: user.email,
    // Add other fields here as needed
  });
  return user;
};

// Export the services
export { app, analytics, db, storage, auth, createUserProfile }; // Add createUserProfile here
