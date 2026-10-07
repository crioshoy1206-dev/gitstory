// 로그인(구글)과 Firestore 저장. 문서는 users/{uid}/worlds/{worldKey} 하나에 상태 전체를 JSON 문자열로 둔다.
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export function watchUser(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser() {
  return signOut(auth);
}

function currentUser(): User {
  if (!auth.currentUser) throw new Error("로그인이 필요합니다");
  return auth.currentUser;
}

function worldRef(uid: string, key: string) {
  return doc(db, "users", uid, "worlds", key);
}

export async function loadCloud(key: string): Promise<{ data: unknown; updatedAt: number } | null> {
  const snap = await getDoc(worldRef(currentUser().uid, key));
  if (!snap.exists()) return null;
  const v = snap.data();
  return { data: JSON.parse(v.data), updatedAt: v.savedAt ?? 0 };
}

export async function saveCloud(key: string, data: unknown, savedAt: number): Promise<void> {
  await setDoc(worldRef(currentUser().uid, key), {
    data: JSON.stringify(data),
    savedAt,
    updatedAt: serverTimestamp(),
  });
}

/** 서버 API 호출. 로그인 토큰을 붙인다. */
export async function callApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await currentUser().getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const detail = (body.error as string) || text.slice(0, 80) || "응답 없음";
    throw Object.assign(new Error(`HTTP ${res.status}: ${detail}`), { status: res.status, body });
  }
  return body as T;
}

export type Usage = { date: string; used: number; limit: number; credits: number };

export function fetchUsage() {
  return callApi<Usage>("/api/usage");
}

export type AnalyzeResult = { analysis: Record<string, unknown>; tokens: number; model: string; usage: Usage };

/** 사건을 AI로 분석한다. 쓴 토큰은 서버가 오늘 한도에서 뺀다. */
export function analyzeEvent(event: { title: string; description: string; story_time: string }, world: unknown) {
  return callApi<AnalyzeResult>("/api/analyze", { method: "POST", body: JSON.stringify({ event, world }) });
}
