// 서버 전용 Firebase Admin. 서비스 계정 키(JSON)는 Vercel 환경변수 FIREBASE_SERVICE_ACCOUNT에 둔다.
import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp(): App {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new AdminNotConfigured("서버 키 없음");
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    throw new AdminNotConfigured("서버 키 형식 오류(JSON 전체를 붙여넣었는지 확인)");
  }
  // 붙여넣는 과정에서 줄바꿈이 \\n 글자로 바뀐 경우를 되돌린다
  if (typeof key.private_key === "string") key.private_key = key.private_key.replace(/\\n/g, "\n");
  try {
    return initializeApp({ credential: cert(key) });
  } catch (e) {
    throw new AdminNotConfigured(`서버 키를 읽지 못함(${(e as Error).message})`);
  }
}

export class AdminNotConfigured extends Error {}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

/** Authorization 헤더(Bearer <ID 토큰>)를 검증하고 uid를 돌려준다. */
export async function requireUser(authorization: string | null): Promise<string> {
  const m = authorization?.match(/^Bearer (.+)$/);
  if (!m) throw new Unauthorized();
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    return decoded.uid;
  } catch (e) {
    if (e instanceof AdminNotConfigured) throw e;
    throw new Unauthorized();
  }
}

export class Unauthorized extends Error {
  constructor() {
    super("로그인이 필요합니다");
  }
}
