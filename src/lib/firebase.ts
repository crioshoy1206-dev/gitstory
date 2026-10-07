import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 웹 앱 설정값은 브라우저에 공개되는 값이라 기본값으로 둔다. 환경변수가 있으면 그 값을 쓴다.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyAL5GzqAz5HcJXbIeH3Pc6-T_7Q1MZzj44",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "gitstory-snu-2026.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "gitstory-snu-2026",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "gitstory-snu-2026.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1067895148909",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:1067895148909:web:22182c5fa9920d63b98a64",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
