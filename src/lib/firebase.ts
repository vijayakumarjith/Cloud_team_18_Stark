import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBL4OvZwPWgN4l3MlDw8NkWxYDYXQ1NewU",
  authDomain: "edcrec-3f802.firebaseapp.com",
  databaseURL: "https://edcrec-3f802-default-rtdb.firebaseio.com",
  projectId: "edcrec-3f802",
  storageBucket: "edcrec-3f802.firebasestorage.app",
  messagingSenderId: "742350940972",
  appId: "1:742350940972:web:788090f86cefe471185a89",
  measurementId: "G-3LC7XELL7B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
