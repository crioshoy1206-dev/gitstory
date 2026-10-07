import "server-only";
import { AdminNotConfigured, Unauthorized } from "@/lib/admin";
import { QuotaExceeded } from "@/lib/quota";

export function errorResponse(e: unknown) {
  if (e instanceof Unauthorized) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof QuotaExceeded) return Response.json({ error: e.message, usage: e.usage }, { status: 429 });
  if (e instanceof AdminNotConfigured) return Response.json({ error: e.message }, { status: 503 });
  console.error(e);
  return Response.json({ error: "서버 오류" }, { status: 500 });
}
