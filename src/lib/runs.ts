// 관리자 AI 실행 기록. 모델 비교를 위해 관리자가 AI를 부를 때마다 입력 요약과 결과 전체를 남긴다.
//   users/{uid}/ai_runs/{자동 id}  { at, kind, model, provider, ms, tokens, detail, input, output }
// 서버(Admin SDK)만 읽고 쓴다. 클라이언트 Firestore 규칙에는 열어 두지 않는다.
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/admin";

export type Run = {
  kind: "analyze" | "extract" | "ask";
  model: string;
  provider: string;
  ms: number;
  tokens: number;
  detail: string;
  input: unknown;
  output: unknown;
};

/** 기록 실패가 AI 응답을 막지 않도록 오류는 로그만 남긴다 */
export async function saveRun(uid: string, run: Run) {
  try {
    // Firestore는 undefined 값을 거부하므로 JSON으로 한 번 걸러 저장한다
    const clean = (x: unknown) => JSON.parse(JSON.stringify(x ?? null));
    await adminDb()
      .collection(`users/${uid}/ai_runs`)
      .add({ ...run, input: clean(run.input), output: clean(run.output), at: Date.now(), createdAt: FieldValue.serverTimestamp() });
  } catch (e) {
    console.warn("AI 실행 기록 실패", e);
  }
}

export async function listRuns(uid: string, limit = 20) {
  const snap = await adminDb().collection(`users/${uid}/ai_runs`).orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const v = d.data();
    return { id: d.id, at: v.at, kind: v.kind, model: v.model, provider: v.provider, ms: v.ms, tokens: v.tokens, detail: v.detail, input: v.input, output: v.output };
  });
}
