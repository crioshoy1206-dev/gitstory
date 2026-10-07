// 사건 분석: AI가 판단(직접 영향, 성격 반응도, 상황 문장, 관계 변화)하고, 숫자 전파 계산은 브라우저 앱이 한다.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
export const EFFORT = (process.env.ANTHROPIC_EFFORT || "low") as "low" | "medium" | "high";
/** 분석 한 번에 필요하다고 보고 미리 확인하는 토큰 양 */
export const ESTIMATE = 3000;

export const TAGS = ["위협", "분노", "상실", "권력공백", "보복위협", "탄압", "기회", "이익", "동원", "정체성"];
const REL_TYPES = ["hostile", "rival", "dominate", "coexist", "alliance", "family", "personal"];

export class AiNotConfigured extends Error {}
export class AiRefused extends Error {}

export type EventInput = { title: string; description: string; story_time?: string };
export type WorldInput = {
  title?: string;
  background?: { title: string; content: string }[];
  groups: { id: string; name: string; parent?: string | null; traits?: { key: string; label: string; value: number }[]; situation?: { current?: string; status?: string } }[];
  characters: { id: string; name: string; aliases?: string[]; memberships?: { group: string; role?: string; bond?: number }[]; traits?: { key: string; label: string; value: number }[]; situation?: { current?: string; status?: string } }[];
  relations: { id: string; from: string; to: string; type: string; intensity: number; note?: string }[];
  unscored_traits?: string[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["direct", "relevance", "rewrite", "relations"],
  properties: {
    direct: {
      type: "array",
      description: "사건이 직접 닿는 단체·인물. 간접 전파는 앱이 계산하므로 넣지 않는다.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["target", "M", "tags", "summary"],
        properties: {
          target: { type: "string", description: "세계관에 있는 단체/인물 id" },
          M: { type: "number", description: "-1(큰 피해) ~ +1(큰 이득)" },
          tags: { type: "array", items: { type: "string", enum: TAGS } },
          summary: { type: "string", description: "이 대상에게 일어난 일, 한 문장" },
        },
      },
    },
    relevance: {
      type: "array",
      description: "unscored_traits 각 성격이 각 태그에 얼마나 반응하는지 (-1~1). 반응 없는 조합은 생략.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["trait", "tag", "rel"],
        properties: { trait: { type: "string" }, tag: { type: "string", enum: TAGS }, rel: { type: "number" } },
      },
    },
    rewrite: {
      type: "array",
      description: "크게 영향받을 단체·인물(직접 대상과 그 핵심 구성원)의 사건 이후 상황",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "text"],
        properties: {
          id: { type: "string" },
          status: { type: "string", description: "짧은 상태어 (예: 위기, 도주중, 세력확장)" },
          text: { type: "string", description: "사건 이후 현재 상황, 1~2문장" },
        },
      },
    },
    relations: {
      type: "array",
      description: "사건으로 바뀌는 관계. 기존 관계는 change, 새 관계는 add.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["op", "id", "from", "to", "type", "intensity", "why"],
        properties: {
          op: { type: "string", enum: ["change", "add"] },
          id: { type: "string", description: "change면 기존 관계 id, add면 새 id (rel_ 로 시작)" },
          from: { type: "string" },
          to: { type: "string" },
          type: { type: "string", enum: REL_TYPES },
          intensity: { type: "number", description: "0~1, 사건 이후 값" },
          why: { type: "string" },
        },
      },
    },
  },
} as const;

const SYSTEM = `당신은 스토리 세계관의 개연성을 지키는 편집자입니다.
사용자가 입력한 사건이 세계관의 단체·인물에 어떤 영향을 주는지 판단합니다.
- direct에는 사건이 직접 닿는 대상만 넣습니다. 소속을 통한 간접 영향은 앱이 계산합니다.
- M은 그 대상이 받는 영향의 크기와 방향입니다 (-1 큰 피해 ~ +1 큰 이득). 태그는 영향의 성격입니다.
- 각 인물의 성격(traits)과 현재 상황에 근거해 판단하고, 세계관에 없는 사실을 지어내지 않습니다.
- 모든 문장은 한국어로, 세계관의 말투에 맞게 씁니다.
- id는 반드시 세계관에 있는 것만 씁니다 (새 관계 id만 예외).`;

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : 0));
}
const r2 = (x: number) => Math.round(x * 100) / 100;

export async function analyzeEvent(event: EventInput, world: WorldInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiNotConfigured("AI 키(ANTHROPIC_API_KEY)가 서버에 등록되지 않았습니다");
  const client = new Anthropic({ apiKey });

  const user = `## 세계관\n${JSON.stringify(world)}\n\n## 사건\n제목: ${event.title}\n작중 시점: ${event.story_time || "(미정)"}\n내용: ${event.description}`;
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT, format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  const tokens = (res.usage.input_tokens ?? 0) + (res.usage.output_tokens ?? 0);
  if (res.stop_reason === "refusal") throw Object.assign(new AiRefused("AI가 이 사건 분석을 거절했습니다"), { tokens });
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  let raw: {
    direct: { target: string; M: number; tags: string[]; summary: string }[];
    relevance: { trait: string; tag: string; rel: number }[];
    rewrite: { id: string; status: string; text: string }[];
    relations: { op: string; id: string; from: string; to: string; type: string; intensity: number; why: string }[];
  };
  try {
    raw = JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`AI 응답을 읽지 못했습니다 (${res.stop_reason})`), { tokens });
  }

  // 검증: 세계관에 있는 id·태그만 남기고 숫자 범위를 자른다
  const ids = new Set([...world.groups, ...world.characters].map((e) => e.id));
  const rels = new Map(world.relations.map((r) => [r.id, r]));
  const direct = raw.direct
    .filter((d) => ids.has(d.target))
    .map((d) => ({ target: d.target, M: r2(clamp(d.M, -1, 1)), tags: d.tags.filter((t) => TAGS.includes(t)), summary: d.summary }))
    .filter((d) => d.tags.length);
  const relevance: Record<string, Record<string, number>> = {};
  const allowed = new Set(world.unscored_traits ?? []);
  raw.relevance.forEach((r) => {
    if (!allowed.has(r.trait) || !TAGS.includes(r.tag)) return;
    (relevance[r.trait] ??= {})[r.tag] = r2(clamp(r.rel, -1, 1));
  });
  const rewrite: Record<string, [string, string]> = {};
  raw.rewrite.forEach((w) => {
    if (ids.has(w.id)) rewrite[w.id] = [w.status, w.text];
  });
  const relations = raw.relations.flatMap((r): { on: boolean; op: string; path: string; after: unknown; why: string }[] => {
    const intensity = r2(clamp(r.intensity, 0, 1));
    const old = rels.get(r.id);
    if (r.op === "change" && old) {
      return [{ on: true, op: "replace", path: `/relations/${r.id}/intensity`, after: intensity, why: r.why }];
    }
    if (r.op === "add" && !old && ids.has(r.from) && ids.has(r.to) && r.from !== r.to && REL_TYPES.includes(r.type)) {
      const id = /^rel_[\w-]+$/.test(r.id) ? r.id : `rel_${r.from}_${r.to}`.replace(/(grp|chr)_/g, "");
      return [{ on: true, op: "add", path: `/relations/${id}`, after: { id, from: r.from, to: r.to, type: r.type, intensity, note: r.why }, why: r.why }];
    }
    return [];
  });
  return { analysis: { title: event.title, description: event.description, story_time: event.story_time ?? "", direct, relevance, rewrite, relations }, tokens, model: res.model };
}
