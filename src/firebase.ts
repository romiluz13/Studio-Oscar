import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCpQEhuk-I-D7spRfIh7o0Ohlco7hwfAJY",
  authDomain: "studio-oscar-life.firebaseapp.com",
  projectId: "studio-oscar-life",
  storageBucket: "studio-oscar-life.appspot.com",
  messagingSenderId: "802666664824",
  appId: "1:802666664824:web:6444aa97499dc5b1926e8d"
};

console.log("Initializing Firebase with config:", firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

console.log("Firebase initialized successfully");

export { auth, db, storage, analytics };