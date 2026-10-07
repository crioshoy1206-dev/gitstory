// 하루 AI 토큰 한도. 사용량은 서버만 쓴다(Firestore 규칙에서 클라이언트 쓰기 금지).
//   users/{uid}                 { credits }   충전 잔액 (하루 한도를 다 쓰면 여기서 차감)
//   users/{uid}/usage/{날짜}     { tokens }    그날(한국 시간) 쓴 토큰
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/admin";

export const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT ?? 20000);

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function today(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

export type Usage = { date: string; used: number; limit: number; credits: number };

export async function getUsage(uid: string): Promise<Usage> {
  const db = adminDb();
  const date = today();
  const [u, user] = await Promise.all([
    db.doc(`users/${uid}/usage/${date}`).get(),
    db.doc(`users/${uid}`).get(),
  ]);
  return { date, used: u.get("tokens") ?? 0, limit: DAILY_LIMIT, credits: user.get("credits") ?? 0 };
}

export class QuotaExceeded extends Error {
  constructor(public usage: Usage) {
    super("오늘 쓸 수 있는 토큰을 모두 사용했습니다");
  }
}

/** 남은 토큰이 needed 이상인지 확인한다. 모자라면 QuotaExceeded. */
export async function assertQuota(uid: string, needed: number): Promise<Usage> {
  const usage = await getUsage(uid);
  if (Math.max(0, usage.limit - usage.used) + usage.credits < needed) throw new QuotaExceeded(usage);
  return usage;
}

/** 실제 사용한 토큰을 기록한다. 하루 한도를 넘는 부분은 충전 잔액에서 뺀다. */
export async function consume(uid: string, tokens: number): Promise<Usage> {
  const db = adminDb();
  const date = today();
  const usageRef = db.doc(`users/${uid}/usage/${date}`);
  const userRef = db.doc(`users/${uid}`);
  return db.runTransaction(async (tx) => {
    const [u, user] = await Promise.all([tx.get(usageRef), tx.get(userRef)]);
    const used: number = u.get("tokens") ?? 0;
    const credits: number = user.get("credits") ?? 0;
    const freeLeft = Math.max(0, DAILY_LIMIT - used);
    const fromCredits = Math.min(credits, Math.max(0, tokens - freeLeft));
    tx.set(usageRef, { tokens: used + tokens, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (fromCredits > 0) tx.set(userRef, { credits: credits - fromCredits }, { merge: true });
    return { date, used: used + tokens, limit: DAILY_LIMIT, credits: credits - fromCredits };
  });
}
