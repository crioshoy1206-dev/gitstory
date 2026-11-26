// 로그인(구글)과 Firestore 저장. 문서는 users/{uid}/worlds/{worldKey} 하나에 상태 전체를 JSON 문자열로 둔다.
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
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

/** 이 사용자의 직접 만든 프로젝트(키가 p_로 시작) 목록 */
export async function listProjects(): Promise<{ key: string; meta: Record<string, string>; savedAt: number }[]> {
  const snap = await getDocs(collection(db, "users", currentUser().uid, "worlds"));
  return snap.docs
    .filter((d) => d.id.startsWith("p_"))
    .flatMap((d) => {
      try {
        const v = d.data();
        const meta = JSON.parse(v.data).meta;
        return meta ? [{ key: d.id, meta, savedAt: v.savedAt ?? 0 }] : [];
      } catch {
        return [];
      }
    });
}

export async function saveCloud(key: string, data: unknown, savedAt: number): Promise<void> {
  await setDoc(worldRef(currentUser().uid, key), {
    data: JSON.stringify(data),
    savedAt,
    updatedAt: serverTimestamp(),
  });
}

const AI_MODEL_KEY = "gitstory.aiModel";

/** 관리자가 고른 AI 모델 ("" = 요금제대로). 이 브라우저에만 기억한다. 서버는 관리자가 아니면 무시한다. */
export function getAiModel(): string {
  try {
    return localStorage.getItem(AI_MODEL_KEY) || "";
  } catch {
    return "";
  }
}

export function setAiModel(id: string) {
  try {
    if (id) localStorage.setItem(AI_MODEL_KEY, id);
    else localStorage.removeItem(AI_MODEL_KEY);
  } catch {}
}

/** 서버 API 호출. 로그인 토큰을 붙인다. */
export async function callApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await currentUser().getIdToken();
  const model = getAiModel();
  const res = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(model ? { "X-AI-Model": model } : {}) },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  let parsed = true;
  try {
    body = JSON.parse(text);
  } catch {
    parsed = false;
  }
  if (res.ok && !parsed) {
    throw Object.assign(new Error("bad response"), { status: 502, body: { error: "AI 응답을 제대로 읽지 못했어요. 다시 눌러 주세요" } });
  }
  if (!res.ok) {
    const detail = (body.error as string) || text.slice(0, 80) || "응답 없음";
    throw Object.assign(new Error(`HTTP ${res.status}: ${detail}`), { status: res.status, body });
  }
  return body as T;
}

export type Usage = {
  date: string; used: number; limit: number; credits: number; plan: "free" | "pro";
  /** 요금제별 하루 한도 */
  limits?: { free: number; pro: number };
  /** 관리자에게만 온다 */
  admin?: boolean; models?: { id: string; label: string }[];
};

export function fetchUsage() {
  return callApi<Usage>("/api/usage");
}

/** 요금제를 바꾼다. Pro는 관리자 키가 있어야 한다 (실제 결제 대신). */
export function changePlan(plan: "free" | "pro", key?: string) {
  return callApi<Usage>("/api/plan", { method: "POST", body: JSON.stringify({ plan, ...(key ? { key } : {}) }) });
}

export type AnalyzeResult = { analysis: Record<string, unknown>; tokens: number; model: string; provider: "claude" | "gemini"; usage: Usage; deep?: boolean };

/** 사건을 AI로 분석한다. deep이면 더 깊이 보는 모델(Opus)로. 쓴 토큰은 서버가 오늘 한도에서 뺀다. */
export function analyzeEvent(event: { title: string; description: string; story_time: string }, world: unknown, deep = false) {
  return callApi<AnalyzeResult>("/api/analyze", { method: "POST", body: JSON.stringify({ event, world, ...(deep ? { deep: true } : {}) }) });
}

export type ExtractResult = {
  characters: { name: string; aliases: string[]; summary: string; group: string; role: string }[];
  groups: { name: string; kind: string; parent: string; summary: string }[];
  updates: { id: string; status: string; text: string }[];
  relations: { from: string; to: string; type: string; intensity: number; note: string }[];
  events: { title: string; description: string; story_time: string }[];
  conflicts?: { quote: string; kind: string; ids: string[]; why: string }[];
};

/** 원고 한 화를 AI로 읽어 세계관에 반영할 후보를 받는다. 원고는 서버에 저장되지 않는다. */
export function extractManuscript(text: string, world: unknown, recent?: unknown[]) {
  return callApi<{ result: ExtractResult; tokens: number; model: string; provider: "claude" | "gemini"; usage: Usage }>("/api/extract", { method: "POST", body: JSON.stringify({ text, world, ...(recent?.length ? { recent } : {}) }) });
}

export type AskResult = { answer: string; sources: { id: string; why: string; from_notes: boolean }[] };

/** 원고·세계관·기록을 읽고 질문에 답한다. 자료는 서버에 저장되지 않는다. */
export function askWorld(payload: unknown) {
  return callApi<{ result: AskResult; tokens: number; model: string; provider: "claude" | "gemini"; usage: Usage }>("/api/ask", { method: "POST", body: JSON.stringify(payload) });
}

export type AiRun = { id: string; at: number; kind: string; model: string; provider: string; ms: number; tokens: number; detail: string; input: unknown; output: unknown };

/** 관리자 AI 실행 기록 (최근 20개) */
export function fetchAiRuns() {
  return callApi<{ runs: AiRun[] }>("/api/ai-runs");
}

export type ShareInfo = { id: string; title: string; label: string; project: string; createdAt: number };

/** 공개 설정집: 고른 시점의 세계관(공개할 칸만)을 읽기 전용 링크로 만든다 */
export function createShare(body: { title: string; label: string; project: string; world: unknown }) {
  return callApi<{ share: ShareInfo }>("/api/share", { method: "POST", body: JSON.stringify(body) });
}
export function listShares() {
  return callApi<{ shares: ShareInfo[] }>("/api/share");
}
export function deleteShare(id: string) {
  return callApi<{ ok: true }>(`/api/share?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
