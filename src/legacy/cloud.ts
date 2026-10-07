// 세계관을 Firestore에 저장한다. 사용자는 익명 로그인으로 구분하고,
// 문서는 users/{uid}/worlds/{worldKey} 하나에 상태 전체를 JSON 문자열로 둔다.
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type CloudStatus = "connecting" | "synced" | "saving" | "offline";

let userPromise: Promise<User> | null = null;

function getUser(): Promise<User> {
  if (!userPromise) {
    userPromise = new Promise<User>((resolve, reject) => {
      const off = onAuthStateChanged(auth, (u) => {
        if (u) {
          off();
          resolve(u);
        }
      });
      signInAnonymously(auth).catch((e) => {
        off();
        userPromise = null;
        reject(e);
      });
    });
  }
  return userPromise;
}

function worldRef(uid: string, key: string) {
  return doc(db, "users", uid, "worlds", key);
}

export async function loadCloud(key: string): Promise<{ data: unknown; updatedAt: number } | null> {
  const user = await getUser();
  const snap = await getDoc(worldRef(user.uid, key));
  if (!snap.exists()) return null;
  const v = snap.data();
  return { data: JSON.parse(v.data), updatedAt: v.savedAt ?? 0 };
}

export async function saveCloud(key: string, data: unknown, savedAt: number): Promise<void> {
  const user = await getUser();
  await setDoc(worldRef(user.uid, key), {
    data: JSON.stringify(data),
    savedAt,
    updatedAt: serverTimestamp(),
  });
}
