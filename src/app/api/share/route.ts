// 공개 설정집 만들기·목록·지우기. 로그인한 작가만. 공개 페이지(/s/[id])는 서버가 직접 읽는다.
async function load() {
  const [admin, api, share] = await Promise.all([import("@/lib/admin"), import("@/lib/api"), import("@/lib/share")]);
  return { ...admin, ...api, ...share };
}

async function handle(req: Request, run: (mods: Awaited<ReturnType<typeof load>>, uid: string) => Promise<Response>) {
  const authorization = req.headers.get("authorization");
  let mods;
  try {
    mods = await load();
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  try {
    const me = await mods.verifyUser(authorization);
    return await run(mods, me.uid);
  } catch (e) {
    if (e instanceof mods.ShareError) return Response.json({ error: e.message }, { status: e.status });
    return mods.errorResponse(e);
  }
}

export async function GET(req: Request) {
  return handle(req, async (m, uid) => Response.json({ shares: await m.listShares(uid) }));
}

export async function POST(req: Request) {
  return handle(req, async (m, uid) => {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "내용이 없어요" }, { status: 400 });
    return Response.json({ share: await m.createShare(uid, body) });
  });
}

export async function DELETE(req: Request) {
  return handle(req, async (m, uid) => {
    const id = new URL(req.url).searchParams.get("id") || "";
    await m.deleteShare(uid, id);
    return Response.json({ ok: true });
  });
}
