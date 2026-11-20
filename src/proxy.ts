import { NextResponse, type NextRequest } from "next/server";

// Google 로그인은 Firebase에 등록된 주소에서만 됩니다.
// 배포마다 생기는 *.vercel.app 주소로 들어오면 고정 주소로 보냅니다.
const CANONICAL_HOST = "gitstory-ashen.vercel.app";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app") && host !== CANONICAL_HOST) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/|_next/|favicon.ico).*)"] };
