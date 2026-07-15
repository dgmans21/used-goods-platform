import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// .env 파일에서 관리 중인 환경 변수 매핑
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js의 핫 리로딩(Hot Reloading) 및 SSR 환경에서 앱이 중복 초기화되는 것을 방지
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 스토리지 서비스 인스턴스 내보내기
export const storage = getStorage(app);