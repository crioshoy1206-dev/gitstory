// 서버 전용 Firebase Admin. 서비스 계정 키(JSON)는 Vercel 환경변수 FIREBASE_SERVICE_ACCOUNT에 둔다.
import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRemoteJWKSet, jwtVerify } from "jose";

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

export const adminDb = () => getFirestore(adminApp());

const PROJECT_ID = "gitstory-snu-2026";
// Firebase ID 토큰 서명 키. firebase-admin/auth(jwks-rsa)는 Vercel의 Node에서 불러오기에 실패해서 직접 검증한다.
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/** Authorization 헤더(Bearer <ID 토큰>)를 검증하고 uid를 돌려준다. */
export async function requireUser(authorization: string | null): Promise<string> {
  const m = authorization?.match(/^Bearer (.+)$/);
  if (!m) throw new Unauthorized();
  try {
    const { payload } = await jwtVerify(m[1], JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Unauthorized();
    return payload.sub;
  } catch {
    throw new Unauthorized();
  }
}

export class Unauthorized extends Error {
  constructor() {
    super("로그인이 필요합니다");
  }
}
