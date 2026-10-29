// 원고 붙여넣기 AI 읽기. 로그인 확인 → 남은 토큰 확인 → AI 호출 → 쓴 토큰만큼 차감. 원고는 저장하지 않는다.
export const maxDuration = 180;

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  let mods;
  try {
    const [admin, api, quota, ai, ex] = await Promise.all([
      import("@/lib/admin"),
      import("@/lib/api"),
      import("@/lib/quota"),
      import("@/lib/analyze"),
      import("@/lib/extract"),
    ]);
    mods = { ...admin, ...api, ...quota, ...ai, ...ex };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  let uid: string | undefined;
  try {
    uid = await mods.requireUser(authorization);
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text || !body?.world?.groups) {
      return Response.json({ error: "원고와 세계관이 필요합니다" }, { status: 400 });
    }
    if (text.length > mods.MAX_CHARS) {
      return Response.json({ error: `원고는 한 번에 ${mods.MAX_CHARS.toLocaleString()}자까지 읽을 수 있어요` }, { status: 413 });
    }
    if (JSON.stringify(body.world).length > 60000) {
      return Response.json({ error: "세계관이 너무 큽니다" }, { status: 413 });
    }
    const before = await mods.assertQuota(uid, mods.EXTRACT_ESTIMATE);
    const { result, tokens, model, provider } = await mods.extractManuscript(text, body.world, before.plan);
    const usage = await mods.consume(uid, tokens);
    return Response.json({ result, tokens, model, provider, usage });
  } catch (e) {
    const spent = (e as { tokens?: number }).tokens;
    if (uid && spent) await mods.consume(uid, spent).catch(console.error);
    if (e instanceof mods.AiNotConfigured) return Response.json({ error: e.message }, { status: 503 });
    if (e instanceof mods.AiBusy) return Response.json({ error: e.message }, { status: 503 });
    if (e instanceof mods.AiTimeout) return Response.json({ error: e.message }, { status: 504 });
    if (e instanceof mods.AiRefused) return Response.json({ error: e.message }, { status: 422 });
    return mods.errorResponse(e);
  }
}
