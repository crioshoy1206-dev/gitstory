// 관리자 AI 실행 기록 목록 (최근 20개). 관리자만.
export async function GET(req: Request) {
  const authorization = req.headers.get("authorization");
  let mods;
  try {
    const [admin, api, runs] = await Promise.all([import("@/lib/admin"), import("@/lib/api"), import("@/lib/runs")]);
    mods = { ...admin, ...api, ...runs };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  try {
    const me = await mods.verifyUser(authorization);
    if (!me.admin) return Response.json({ error: "관리자만 볼 수 있어요" }, { status: 403 });
    return Response.json({ runs: await mods.listRuns(me.uid) });
  } catch (e) {
    return mods.errorResponse(e);
  }
}
