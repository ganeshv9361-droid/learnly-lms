import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDFrVUnncjkaJyH0oCRnYrR7dByl9PrLrA",
  authDomain: "learnly-app-12579.firebaseapp.com",
  projectId: "learnly-app-12579",
  storageBucket: "learnly-app-12579.firebasestorage.app",
  messagingSenderId: "91443079057",
  appId: "1:91443079057:web:545488f8703ce91cba9c30"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
