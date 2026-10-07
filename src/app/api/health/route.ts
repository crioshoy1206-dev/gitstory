// 서버 함수가 살아 있는지와 서버 키가 등록됐는지만 알려준다 (키 내용은 노출하지 않음)
export async function GET(req: Request) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  void req.headers;
  let keyJson = false;
  try {
    keyJson = !!raw && !!JSON.parse(raw).private_key;
  } catch {}
  return Response.json({ ok: true, node: process.version, serviceAccountSet: !!raw, serviceAccountValid: keyJson });
}
