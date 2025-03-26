import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6l0qbDNjTKb6RPaPDfLyjQY1drPf9u5A",
  authDomain: "destination-7adeb.firebaseapp.com",
  projectId: "destination-7adeb",
  storageBucket: "destination-7adeb.appspot.com", // Note: Fix the storage domain if incorrect
  messagingSenderId: "1028301786204",
  appId: "1:1028301786204:web:169a24cba56f68a974aa99",
  measurementId: "G-NWMEQGGZP8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the services
export { app, analytics, db, storage };
