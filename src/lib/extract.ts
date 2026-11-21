// 원고 붙여넣기: 원고 한 화에서 새 인물·단체, 기존 항목의 상황 변화, 새 관계, 사건 후보를 뽑는다.
// 원고 원문은 저장하지 않는다. 작가가 후보를 고르면 브라우저가 수동 수정으로 담는다.
import "server-only";
import { generate, REL_TYPES, worldText, type Route, type WorldInput } from "@/lib/analyze";

export const MAX_CHARS = 12000;
/** 원고 읽기 한 번에 필요하다고 보고 미리 확인하는 토큰 양 */
export const EXTRACT_ESTIMATE = 6000;
const KINDS = ["nation", "organization", "faction", "solo"];
/** 개연성 검사: 원고가 그 화 시점의 세계관과 어긋나는 종류 */
export const CONFLICT_KINDS = ["행동불가 인물 등장", "관계와 맞지 않는 태도", "소속·상태 모순", "모를 정보를 앎", "앞 사건과 충돌"];
export type RecentEvent = { n: number; title: string; story_time?: string; description?: string };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["characters", "groups", "updates", "relations", "events", "conflicts"],
  properties: {
    characters: {
      type: "array",
      description: "원고에 처음 나온 인물. 세계관에 이미 있는 인물(다른 이름 포함)은 넣지 않는다.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "aliases", "summary", "group", "role"],
        properties: {
          name: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
          summary: { type: "string", description: "원고에 드러난 이 인물의 현재 상황, 1문장" },
          group: { type: "string", description: "소속 단체의 id 또는 이번에 새로 나온 단체 이름. 없으면 빈 문자열" },
          role: { type: "string", description: "단체 안에서의 역할. 없으면 빈 문자열" },
        },
      },
    },
    groups: {
      type: "array",
      description: "원고에 처음 나온 단체. 세계관에 이미 있는 단체는 넣지 않는다.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kind", "parent", "summary"],
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: KINDS },
          parent: { type: "string", description: "상위 단체 id. 없으면 빈 문자열" },
          summary: { type: "string" },
        },
      },
    },
    updates: {
      type: "array",
      description: "원고에서 상황이 바뀐 기존 단체·인물",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "text"],
        properties: {
          id: { type: "string" },
          status: { type: "string", description: "짧은 상태어" },
          text: { type: "string", description: "원고 이후 현재 상황, 1~2문장" },
        },
      },
    },
    relations: {
      type: "array",
      description: "원고에서 새로 드러난 관계. from/to는 기존 id 또는 이번에 새로 나온 인물·단체 이름",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "type", "intensity", "note"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          type: { type: "string", enum: REL_TYPES },
          intensity: { type: "number", description: "0~1" },
          note: { type: "string" },
        },
      },
    },
    events: {
      type: "array",
      description: "세계관에 영향을 줄 만한 사건. 사소한 장면은 빼고 큰 사건만 (보통 0~3개)",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "story_time"],
        properties: { title: { type: "string" }, description: { type: "string" }, story_time: { type: "string" } },
      },
    },
    conflicts: {
      type: "array",
      description: "원고 문장이 세계관(이 화 시점)이나 앞 사건과 분명히 어긋나는 곳. 확실한 것만, 보통 0~3개, 최대 5개. 없으면 빈 배열",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "kind", "ids", "why"],
        properties: {
          quote: { type: "string", description: "어긋나는 원고 문장을 원고에서 글자 그대로 복사 (80자 이내, 고치거나 줄이지 않음)" },
          kind: { type: "string", enum: CONFLICT_KINDS },
          ids: { type: "array", items: { type: "string" }, description: "관련된 세계관 인물·단체·관계 id" },
          why: { type: "string", description: "세계관의 어떤 설정과 왜 어긋나는지 1~2문장. 근거 설정을 구체적으로" },
        },
      },
    },
  },
} as const;

const SYSTEM = `당신은 작가의 원고를 읽고 세계관 설정집을 정리하는 편집자입니다.
원고 한 화와 지금까지의 세계관을 받아, 설정집에 반영할 후보를 뽑습니다.
- 원고에 실제로 쓰인 내용만 뽑고, 짐작으로 지어내지 않습니다.
- 이미 세계관에 있는 인물·단체는 다른 이름(별명, 호칭)으로 나와도 새로 만들지 말고, 바뀐 상황이 있으면 updates에 기존 id로 넣습니다.
- 기존 항목을 가리킬 때는 반드시 세계관에 있는 id를 씁니다.
- 이름 없는 단역(행인, 경비병 1 등)은 넣지 않습니다.
- 모든 문장은 한국어로 짧게 씁니다.
개연성 검사(conflicts):
- 세계관은 이 화 시점의 설정입니다. 원고가 이 설정이나 앞 사건과 분명히 어긋나는 문장만 짚습니다. 원고를 고치지 않고 짚기만 합니다.
- 짚을 것: [행동불가] 인물이 직접 말하거나 움직임, 대립·결별한 사이인데 이유 없이 다정함(또는 그 반대), 소속·상태와 모순되는 행동, 그 인물이 알 수 없는 정보를 앎(인물의 '아는 것'에 없는 비밀), 앞 사건 결과와 반대되는 서술.
- 짚지 말 것: 회상·꿈·소문·거짓말·위장·연기로 읽히는 장면, 원고 안에서 변화의 이유가 그려진 경우, 세계관에 없는 새로운 사실(새 사실은 모순이 아님), 문체나 문장 품질.
- 애매하면 넣지 않습니다. 작가가 일부러 쓴 반전일 수 있으니 판정이 아니라 확인 요청으로 씁니다.`;

type Out = {
  characters: { name: string; aliases: string[]; summary: string; group: string; role: string }[];
  groups: { name: string; kind: string; parent: string; summary: string }[];
  updates: { id: string; status: string; text: string }[];
  relations: { from: string; to: string; type: string; intensity: number; note: string }[];
  events: { title: string; description: string; story_time: string }[];
  conflicts: { quote: string; kind: string; ids: string[]; why: string }[];
};

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

export async function extractManuscript(text: string, world: WorldInput, plan: Route = "free", recent: RecentEvent[] = []) {
  const one = (t?: string) => (t ?? "").replace(/\s+/g, " ").trim();
  const past = recent.length ? `\n\n## 이 화 시점까지의 사건 (오래된 순)\n${recent.map((e) => `${e.n}. ${one(e.title)}${e.story_time ? ` (${one(e.story_time)})` : ""}${e.description ? `: ${one(e.description)}` : ""}`).join("\n")}` : "";
  const user = `## 세계관 (이 화 시점)\n${worldText(world)}${past}\n\n## 원고\n${text}`;
  const { data: raw, tokens, model, provider, detail, ms } = await generate<Out>(plan, { system: SYSTEM, schema: SCHEMA, user, maxTokens: 7000 }, "extract");

  // 검증: 이미 있는 이름(다른 이름 포함)과 겹치는 새 항목은 버리고, id·관계 유형·숫자 범위를 맞춘다
  const ids = new Set([...world.groups, ...world.characters].map((e) => e.id));
  const known = new Map<string, string>();
  world.groups.forEach((g) => known.set(norm(g.name), g.id));
  world.characters.forEach((c) => [c.name, ...(c.aliases ?? [])].forEach((n) => n && known.set(norm(n), c.id)));
  const seen = new Set<string>();
  const fresh = (name: string) => {
    const k = norm(name);
    if (!k || known.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  };
  const groups = raw.groups
    .filter((g) => fresh(g.name))
    .map((g) => ({ name: g.name.trim(), kind: KINDS.includes(g.kind) ? g.kind : "organization", parent: ids.has(g.parent) ? g.parent : "", summary: g.summary }));
  const newNames = new Set(groups.map((g) => g.name));
  const characters = raw.characters
    .filter((c) => fresh(c.name))
    .map((c) => {
      const aliases = c.aliases.map((a) => a.trim()).filter((a) => a && !known.has(norm(a)));
      const group = ids.has(c.group) ? c.group : known.get(norm(c.group)) ?? (newNames.has(c.group) ? c.group : "");
      return { name: c.name.trim(), aliases, summary: c.summary, group, role: c.role };
    });
  characters.forEach((c) => newNames.add(c.name));
  // 관계 양 끝은 기존 id나 새 이름. 이름으로 온 기존 항목은 id로 바꾼다.
  const ref = (x: string) => (ids.has(x) ? x : known.get(norm(x)) ?? (newNames.has(x) ? x : ""));
  const relations = raw.relations.flatMap((r) => {
    const from = ref(r.from), to = ref(r.to);
    if (!from || !to || from === to || !REL_TYPES.includes(r.type)) return [];
    return [{ from, to, type: r.type, intensity: Math.round(Math.max(0, Math.min(1, r.intensity || 0)) * 100) / 100, note: r.note }];
  });
  const updates = raw.updates.filter((u) => ids.has(u.id));
  const events = raw.events.filter((e) => e.description?.trim()).slice(0, 5);
  // 개연성 검사: 원고에 실제로 있는 문장만 남긴다 (AI가 문장을 지어내면 짚을 곳이 없으니 버린다)
  const flat = (t: string) => t.replace(/\s+/g, "");
  const body = flat(text);
  const relIds = new Set(world.relations.map((r) => r.id));
  const conflicts = (raw.conflicts ?? [])
    .map((c) => ({ quote: String(c.quote ?? "").trim().slice(0, 200), kind: CONFLICT_KINDS.includes(c.kind) ? c.kind : "앞 사건과 충돌", ids: [...new Set((c.ids ?? []).filter((id) => ids.has(id) || relIds.has(id)))].slice(0, 4), why: String(c.why ?? "").trim() }))
    .filter((c) => c.why && c.quote && body.includes(flat(c.quote).slice(0, 24)))
    .slice(0, 5);
  return { result: { characters, groups, updates, relations, events, conflicts }, tokens, model, provider, detail, ms };
}
