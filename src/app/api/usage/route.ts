import { requireUser } from "@/lib/admin";
import { errorResponse } from "@/lib/api";
import { getUsage } from "@/lib/quota";

export async function GET(req: Request) {
  // 헤더는 try 밖에서 읽는다 (Next가 동적 렌더링 전환용으로 던지는 신호를 잡지 않도록)
  const authorization = req.headers.get("authorization");
  try {
    const uid = await requireUser(authorization);
    return Response.json(await getUsage(uid));
  } catch (e) {
    return errorResponse(e);
  }
}
