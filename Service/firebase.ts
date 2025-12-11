import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// !!! IMPORTANT !!!
// Replace the object below with your actual Firebase Project Configuration.
// You can find this in your Firebase Console -> Project Settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
