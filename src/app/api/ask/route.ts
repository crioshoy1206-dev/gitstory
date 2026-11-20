// 물어보기. 로그인 확인 → 남은 토큰 확인 → AI 호출 → 쓴 토큰만큼 차감. 자료는 저장하지 않는다.
export const maxDuration = 180;

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  const wantModel = req.headers.get("x-ai-model");
  let mods;
  try {
    const [admin, api, quota, ai, ask, runs] = await Promise.all([
      import("@/lib/admin"),
      import("@/lib/api"),
      import("@/lib/quota"),
      import("@/lib/analyze"),
      import("@/lib/ask"),
      import("@/lib/runs"),
    ]);
    mods = { ...admin, ...api, ...quota, ...ai, ...ask, ...runs };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  let uid: string | undefined;
  let admin = false;
  try {
    const me = await mods.verifyUser(authorization);
    uid = me.uid;
    admin = me.admin;
    const body = await req.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (!question || !body?.world) return Response.json({ error: "질문과 세계관이 필요합니다" }, { status: 400 });
    const size = JSON.stringify(body).length;
    if (size > mods.ASK_MAX_CHARS * 1.5) return Response.json({ error: "보낼 자료가 너무 많아요" }, { status: 413 });
    const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 2000) : [];
    const before = await mods.assertQuota(uid, mods.ASK_ESTIMATE, me.admin);
    const { result, tokens, model, provider, detail, ms } = await mods.askWorld(
      {
        question,
        quote: typeof body.quote === "string" ? body.quote.slice(0, 1500) : undefined,
        world: body.world,
        notes: Array.isArray(body.notes) ? body.notes : undefined,
        chapters: Array.isArray(body.chapters) ? body.chapters : undefined,
        commits: Array.isArray(body.commits) ? body.commits : undefined,
        ids,
      },
      mods.routeFor(me.admin, wantModel, before.plan),
    );
    if (me.admin) await mods.saveRun(uid, { kind: "ask", model, provider, ms, tokens, detail, input: { question }, output: result });
    const usage = mods.withAdmin(me.admin, await mods.consume(uid, tokens, me.admin));
    return Response.json({ result, tokens, model, provider, usage });
  } catch (e) {
    const spent = (e as { tokens?: number }).tokens;
    if (uid && spent) await mods.consume(uid, spent, admin).catch(console.error);
    if (e instanceof mods.AiNotConfigured) return Response.json({ error: e.message }, { status: 503 });
    if (e instanceof mods.AiBusy) return Response.json({ error: e.message }, { status: 503 });
    if (e instanceof mods.AiTimeout) return Response.json({ error: e.message }, { status: 504 });
    if (e instanceof mods.AiRefused) return Response.json({ error: e.message }, { status: 422 });
    return mods.errorResponse(e);
  }
}
