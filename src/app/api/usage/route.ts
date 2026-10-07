export async function GET(req: Request) {
  // 헤더는 try 밖에서 읽는다 (Next가 동적 렌더링 전환용으로 던지는 신호를 잡지 않도록)
  const authorization = req.headers.get("authorization");
  // 서버 라이브러리를 여기서 불러와, 불러오기 실패도 오류 내용으로 돌려준다
  let mods;
  try {
    const [admin, api, quota] = await Promise.all([import("@/lib/admin"), import("@/lib/api"), import("@/lib/quota")]);
    mods = { ...admin, ...api, ...quota };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  try {
    const uid = await mods.requireUser(authorization);
    return Response.json(await mods.getUsage(uid));
  } catch (e) {
    return mods.errorResponse(e);
  }
}
