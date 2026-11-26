// 하루 AI 토큰 한도. 사용량은 서버만 쓴다(Firestore 규칙에서 클라이언트 쓰기 금지).
//   users/{uid}                 { credits, plan }   충전 잔액(하루 한도를 다 쓰면 여기서 차감), 요금제 "free"|"pro"
//                               (요금제는 /api/plan에서 관리자 키로 바꾼다. 실제 결제는 아직 없음)
//   users/{uid}/usage/{날짜}     { tokens }    그날(한국 시간) 쓴 토큰
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/admin";

export type Plan = "free" | "pro";
export const DAILY_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT ?? 20000);
/** Pro 요금제의 하루 한도 */
export const PRO_DAILY_LIMIT = Number(process.env.PRO_DAILY_TOKEN_LIMIT ?? 200000);
export const LIMITS: Record<Plan, number> = { free: DAILY_LIMIT, pro: PRO_DAILY_LIMIT };
const planOf = (v: unknown): Plan => (v === "pro" ? "pro" : "free");

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function today(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

export type Usage = { date: string; used: number; limit: number; credits: number; plan: Plan; limits: Record<Plan, number> };

export async function getUsage(uid: string): Promise<Usage> {
  const db = adminDb();
  const date = today();
  const [u, user] = await Promise.all([
    db.doc(`users/${uid}/usage/${date}`).get(),
    db.doc(`users/${uid}`).get(),
  ]);
  const plan = planOf(user.get("plan"));
  return { date, used: u.get("tokens") ?? 0, limit: LIMITS[plan], credits: user.get("credits") ?? 0, plan, limits: LIMITS };
}

export class QuotaExceeded extends Error {
  constructor(public usage: Usage) {
    super("오늘 쓸 수 있는 토큰을 모두 사용했습니다");
  }
}

/** 남은 토큰이 needed 이상인지 확인한다. 모자라면 QuotaExceeded. 관리자(unlimited)는 확인만 하고 막지 않는다. */
export async function assertQuota(uid: string, needed: number, unlimited = false): Promise<Usage> {
  const usage = await getUsage(uid);
  if (unlimited) return usage;
  if (Math.max(0, usage.limit - usage.used) + usage.credits < needed) throw new QuotaExceeded(usage);
  return usage;
}

/** 실제 사용한 토큰을 기록한다. 하루 한도를 넘는 부분은 충전 잔액에서 뺀다. */
export async function consume(uid: string, tokens: number, unlimited = false): Promise<Usage> {
  const db = adminDb();
  const date = today();
  const usageRef = db.doc(`users/${uid}/usage/${date}`);
  const userRef = db.doc(`users/${uid}`);
  return db.runTransaction(async (tx) => {
    const [u, user] = await Promise.all([tx.get(usageRef), tx.get(userRef)]);
    const used: number = u.get("tokens") ?? 0;
    const credits: number = user.get("credits") ?? 0;
    const plan = planOf(user.get("plan"));
    const freeLeft = Math.max(0, LIMITS[plan] - used);
    // 관리자는 사용량만 기록하고 충전 잔액은 건드리지 않는다
    const fromCredits = unlimited ? 0 : Math.min(credits, Math.max(0, tokens - freeLeft));
    tx.set(usageRef, { tokens: used + tokens, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (fromCredits > 0) tx.set(userRef, { credits: credits - fromCredits }, { merge: true });
    return { date, used: used + tokens, limit: LIMITS[plan], credits: credits - fromCredits, plan, limits: LIMITS };
  });
}
