// 사건 AI 분석. 로그인 확인 → 남은 토큰 확인 → AI 호출 → 쓴 토큰만큼 차감
export const maxDuration = 120;

export async function POST(req: Request) {
  // 헤더는 try 밖에서 읽는다 (Next가 동적 렌더링 전환용으로 던지는 신호를 잡지 않도록)
  const authorization = req.headers.get("authorization");
  let mods;
  try {
    const [admin, api, quota, ai] = await Promise.all([
      import("@/lib/admin"),
      import("@/lib/api"),
      import("@/lib/quota"),
      import("@/lib/analyze"),
    ]);
    mods = { ...admin, ...api, ...quota, ...ai };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  let uid: string | undefined;
  try {
    uid = await mods.requireUser(authorization);
    const body = await req.json().catch(() => null);
    if (!body?.event?.description || !body?.world?.groups) {
      return Response.json({ error: "사건 내용과 세계관이 필요합니다" }, { status: 400 });
    }
    if (JSON.stringify(body.world).length > 60000) {
      return Response.json({ error: "세계관이 너무 큽니다" }, { status: 413 });
    }
    const before = await mods.assertQuota(uid, mods.ESTIMATE);
    const { analysis, tokens, model, provider } = await mods.analyzeEvent(body.event, body.world, before.plan);
    const usage = await mods.consume(uid, tokens);
    return Response.json({ analysis, tokens, model, provider, usage });
  } catch (e) {
    // 거절·파싱 실패여도 AI가 쓴 토큰은 차감한다
    const spent = (e as { tokens?: number }).tokens;
    if (uid && spent) await mods.consume(uid, spent).catch(console.error);
    if (e instanceof mods.AiNotConfigured) return Response.json({ error: e.message }, { status: 503 });
    if (e instanceof mods.AiRefused) return Response.json({ error: e.message }, { status: 422 });
    return mods.errorResponse(e);
  }
}
