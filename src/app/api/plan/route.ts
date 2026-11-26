// 요금제 바꾸기. 실제 결제 대신 관리자 키(Vercel 환경변수 PLAN_ADMIN_KEY)를 알면 Pro로 바꿀 수 있다.
//   POST { plan: "pro", key }  → Pro로 (키가 맞을 때만)
//   POST { plan: "free" }      → 무료로 (키 없이)
// 틀린 키는 하루(한국 시간)에 5번까지만 받는다.
export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  let mods;
  try {
    const [admin, api, quota, ai, fs, crypto] = await Promise.all([
      import("@/lib/admin"), import("@/lib/api"), import("@/lib/quota"), import("@/lib/analyze"),
      import("firebase-admin/firestore"), import("node:crypto"),
    ]);
    mods = { ...admin, ...api, ...quota, ...ai, FieldValue: fs.FieldValue, createHash: crypto.createHash, timingSafeEqual: crypto.timingSafeEqual };
  } catch (e) {
    console.error(e);
    return Response.json({ error: `서버 라이브러리 로드 실패: ${(e as Error).message?.slice(0, 160)}` }, { status: 500 });
  }
  try {
    const me = await mods.verifyUser(authorization);
    let body: { plan?: unknown; key?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "요청 형식이 잘못됐어요" }, { status: 400 });
    }
    const plan = body.plan;
    if (plan !== "free" && plan !== "pro") return Response.json({ error: "요금제는 free 또는 pro예요" }, { status: 400 });

    const db = mods.adminDb();
    const userRef = db.doc(`users/${me.uid}`);
    if (plan === "pro") {
      const secret = process.env.PLAN_ADMIN_KEY?.trim();
      if (!secret) return Response.json({ error: "관리자 키가 아직 설정되지 않았어요" }, { status: 503 });
      const date = mods.today();
      const user = await userRef.get();
      const fails = user.get("planKeyFailDate") === date ? (user.get("planKeyFails") ?? 0) : 0;
      if (fails >= 5) return Response.json({ error: "키를 너무 많이 틀렸어요. 내일 다시 시도해 주세요" }, { status: 429 });
      const key = typeof body.key === "string" ? body.key.trim() : "";
      const h = (s: string) => mods.createHash("sha256").update(s).digest();
      if (!key || !mods.timingSafeEqual(h(key), h(secret))) {
        await userRef.set({ planKeyFails: fails + 1, planKeyFailDate: date }, { merge: true });
        const left = 4 - fails;
        return Response.json({ error: left > 0 ? `관리자 키가 맞지 않아요 (오늘 ${left}번 더 시도할 수 있어요)` : "관리자 키가 맞지 않아요. 오늘은 더 시도할 수 없어요" }, { status: 403 });
      }
      await userRef.set({ plan: "pro", planSince: mods.FieldValue.serverTimestamp(), planBy: "admin-key", planKeyFails: 0 }, { merge: true });
    } else {
      await userRef.set({ plan: "free", planSince: mods.FieldValue.serverTimestamp(), planBy: "user" }, { merge: true });
    }
    const usage = await mods.getUsage(me.uid);
    return Response.json(mods.withAdmin(me.admin, usage));
  } catch (e) {
    return mods.errorResponse(e);
  }
}
