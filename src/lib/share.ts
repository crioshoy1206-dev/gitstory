// 스포일러 없는 공개 설정집: 작가가 고른 기록 시점의 세계관을 읽기 전용 링크로 공개한다.
// 메모·'아는 것'(비밀)·상황 이력·성격 수치는 빼고, 이름·소속·상황·관계·배경만 남긴다. 서버(firebase-admin)만 읽고 쓴다.
import "server-only";
import { randomBytes } from "node:crypto";
import { adminDb } from "@/lib/admin";

export const SHARE_LIMIT = 20;
const MAX_BYTES = 700_000;
const KINDS = ["nation", "organization", "faction", "solo"];
const RELS = ["hostile", "rival", "dominate", "coexist", "alliance", "family", "personal"];

export type PubWorld = {
  groups: { id: string; name: string; kind: string; parent: string | null; status: string; current: string }[];
  characters: { id: string; name: string; aliases: string[]; groups: { group: string; role: string }[]; status: string; current: string; photo?: string }[];
  relations: { from: string; to: string; type: string; intensity: number; note: string; directed: boolean }[];
  background: { title: string; category: string; content: string }[];
  pos: Record<string, [number, number]>;
};
export type Share = { id: string; owner: string; title: string; label: string; createdAt: number; world: PubWorld };

export class ShareError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const str = (x: unknown, n: number) => (typeof x === "string" ? x.trim().slice(0, n) : "");
const arr = (x: unknown): Record<string, unknown>[] => (Array.isArray(x) ? x.filter((v) => v && typeof v === "object") : []);
const idOk = (x: unknown) => typeof x === "string" && /^[\w-]{1,60}$/.test(x);
/** 작가가 비밀이라고 표시한 글([비밀] (비밀) [GM] [스포], '비밀:'로 시작)은 브라우저가 빼고 보내지만 서버에서도 한 번 더 뺀다 */
const SECRET_MARK = /[[(（【]\s*(비밀|GM|스포|스포일러|숨김)\s*[\])）】]|^\s*(비밀|GM|스포)\s*[:：]/i;
const pub = (x: unknown, n: number) => { const t = str(x, n); return SECRET_MARK.test(t) ? "" : t; };

/** 브라우저가 보낸 세계관에서 공개할 칸만 골라낸다 (브라우저도 걸러 보내지만 서버에서 한 번 더) */
export function sanitize(raw: unknown): PubWorld {
  const w = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sit = (e: Record<string, unknown>) => (e.situation && typeof e.situation === "object" ? (e.situation as Record<string, unknown>) : {});
  const groups = arr(w.groups).filter((g) => idOk(g.id)).slice(0, 300).map((g) => ({
    id: g.id as string, name: str(g.name, 60), kind: KINDS.includes(g.kind as string) ? (g.kind as string) : "organization",
    parent: idOk(g.parent) ? (g.parent as string) : null, status: pub(sit(g).status, 40), current: pub(sit(g).current, 400),
  }));
  const characters = arr(w.characters).filter((c) => idOk(c.id)).slice(0, 500).map((c) => {
    const photo = typeof c.photo === "string" && /^data:image\/(jpeg|png|webp);base64,[\w+/=]+$/.test(c.photo) && c.photo.length < 40_000 ? c.photo : undefined;
    return {
      id: c.id as string, name: str(c.name, 60), aliases: (Array.isArray(c.aliases) ? c.aliases : []).map((a) => pub(a, 40)).filter(Boolean).slice(0, 6),
      groups: arr(c.memberships).filter((m) => idOk(m.group) && m.active !== false && !SECRET_MARK.test(str(m.role, 30))).slice(0, 10).map((m) => ({ group: m.group as string, role: str(m.role, 30) })),
      status: pub(sit(c).status, 40), current: pub(sit(c).current, 400), ...(photo ? { photo } : {}),
    };
  });
  const ids = new Set([...groups, ...characters].map((e) => e.id));
  const relations = arr(w.relations).filter((r) => ids.has(r.from as string) && ids.has(r.to as string) && RELS.includes(r.type as string)).slice(0, 1000).map((r) => ({
    from: r.from as string, to: r.to as string, type: r.type as string, intensity: Math.max(0, Math.min(1, Number(r.intensity) || 0)), note: pub(r.note, 120), directed: !!r.directed,
  }));
  const background = arr(w.background).slice(0, 100).map((b) => ({ title: str(b.title, 80), category: str(b.category, 30), content: str(b.content, 1500) })).filter((b) => b.title && ![b.title, b.category, b.content].some((t) => SECRET_MARK.test(t)));
  const pos: Record<string, [number, number]> = {};
  if (w.pos && typeof w.pos === "object") Object.entries(w.pos as Record<string, unknown>).forEach(([k, v]) => {
    if (ids.has(k) && Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n))) pos[k] = [Math.round(v[0] as number), Math.round(v[1] as number)];
  });
  return { groups, characters, relations, background, pos };
}

export async function createShare(owner: string, body: { title?: unknown; label?: unknown; project?: unknown; world?: unknown }) {
  const db = adminDb();
  const mine = await db.collection("shares").where("owner", "==", owner).count().get();
  if (mine.data().count >= SHARE_LIMIT) throw new ShareError(`공개 설정집은 ${SHARE_LIMIT}개까지 만들 수 있어요. 안 쓰는 링크를 지워 주세요`, 409);
  const world = sanitize(body.world);
  if (!world.characters.length && !world.groups.length) throw new ShareError("공개할 인물이나 단체가 없어요");
  const data = JSON.stringify(world);
  if (data.length > MAX_BYTES) throw new ShareError("세계관이 너무 커서 공개 링크로 만들 수 없어요. 사진을 빼 보세요", 413);
  const id = randomBytes(9).toString("base64url");
  const share = { owner, title: str(body.title, 80) || "설정집", label: str(body.label, 60), project: str(body.project, 80), createdAt: Date.now(), data };
  await db.collection("shares").doc(id).set(share);
  return { id, title: share.title, label: share.label, project: share.project, createdAt: share.createdAt };
}

export async function listShares(owner: string) {
  const snap = await adminDb().collection("shares").where("owner", "==", owner).get();
  return snap.docs.map((d) => ({ id: d.id, title: d.get("title") as string, label: d.get("label") as string, project: (d.get("project") as string) || "", createdAt: d.get("createdAt") as number })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteShare(owner: string, id: string) {
  const ref = adminDb().collection("shares").doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.get("owner") !== owner) throw new ShareError("링크를 찾지 못했어요", 404);
  await ref.delete();
}

export async function getShare(id: string): Promise<Share | null> {
  if (!/^[\w-]{6,40}$/.test(id)) return null;
  const doc = await adminDb().collection("shares").doc(id).get();
  if (!doc.exists) return null;
  const v = doc.data() as { owner: string; title: string; label: string; createdAt: number; data: string };
  return { id, owner: v.owner, title: v.title, label: v.label, createdAt: v.createdAt, world: JSON.parse(v.data) as PubWorld };
}
