// 사건 분석: AI가 판단(직접 영향, 성격 반응도, 상황 문장, 관계 변화)하고, 숫자 전파 계산은 브라우저 앱이 한다.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// 요금제별 모델: 무료 = Gemini Flash(원가 낮음), 유료 = Claude Sonnet(판단 품질). 형식 "제공사:모델"
export type Plan = "free" | "pro";
/** 요금제 대신 모델을 직접 지정할 때 ("제공사:모델"). 관리자만 쓸 수 있다. */
export type Route = Plan | `${"claude" | "gemini"}:${string}`;
const PLAN_MODEL: Record<Plan, string> = {
  free: process.env.AI_MODEL_FREE || "gemini:gemini-3.8-flash",
  pro: process.env.AI_MODEL_PRO || "claude:claude-sonnet-5-5",
};
/** 사건 분석 기본 모델과 "깊게 분석" 모델. Claude 키가 없으면 요금제 모델로 대신한다. */
const ANALYZE_MODEL = process.env.AI_MODEL_ANALYZE || "claude:claude-sonnet-5-5";
const DEEP_MODEL = process.env.AI_MODEL_DEEP || "claude:claude-opus-5-5";
/** 서버 함수 제한(maxDuration 180초) 전에 AI 호출을 끊어, 시간 초과도 알아볼 수 있는 오류로 돌려준다 */
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 150000);
let lastGoodGemini = "";
/** Gemini가 붐빌 때(503·429) 차례로 시도할 다른 모델 */
const GEMINI_FALLBACKS = (process.env.AI_GEMINI_FALLBACKS || "gemini-3.7-flash,gemini-3.5-flash").split(",").map((m) => m.trim()).filter(Boolean);
const EFFORT = (process.env.AI_EFFORT || "low") as "low" | "medium" | "high";
/** 분석 한 번에 필요하다고 보고 미리 확인하는 토큰 양 */
export const ESTIMATE = 3000;

export const TAGS = ["위협", "분노", "상실", "권력공백", "보복위협", "탄압", "기회", "이익", "동원", "정체성"];
export const REL_TYPES = ["hostile", "rival", "dominate", "coexist", "alliance", "family", "personal"];

export class AiNotConfigured extends Error {}
export class AiRefused extends Error {}
export class AiTimeout extends Error {}
export class AiBusy extends Error {}

export type EventInput = { title: string; description: string; story_time?: string };
export type WorldInput = {
  title?: string;
  background?: { title: string; content: string }[];
  groups: { id: string; name: string; parent?: string | null; traits?: { key: string; label: string; value: number; target?: string }[]; situation?: { current?: string; status?: string } }[];
  characters: { id: string; name: string; aliases?: string[]; memberships?: { group: string; role?: string; bond?: number }[]; traits?: { key: string; label: string; value: number; target?: string }[]; situation?: { current?: string; status?: string } }[];
  relations: { id: string; from: string; to: string; type: string; intensity: number; note?: string }[];
  unscored_traits?: string[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["aftermath", "direct", "relevance", "rewrite", "reactions", "relations"],
  properties: {
    aftermath: { type: "string", description: "사건 직후 세계가 어떻게 흘러가는지 2~4문장. 무엇이 무너지거나 생기고, 누가 움직이기 시작하는지." },
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
    reactions: {
      type: "array",
      description:
        "사건에 연루된 인물·단체와, 직접 연루되지 않았어도 소속·관계·성격 때문에 영향받는 인물·단체가 각각 무엇을 잃거나 얻었고 앞으로 어떻게 행동할지. 중요한 순서로 최대 10개, 인물을 우선.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "involvement", "impact", "action"],
        properties: {
          id: { type: "string", description: "세계관에 있는 인물/단체 id" },
          involvement: { type: "string", enum: ["연루", "파급"], description: "연루: 사건 현장·당사자. 파급: 소속·관계를 통해 영향받음" },
          impact: { type: "string", description: "이 사건으로 잃은 것(손해) 또는 얻은 것. 구체적으로 1~2문장" },
          action: { type: "string", description: "성격과 상황에 근거해 앞으로 어떻게 행동할지. 구체적으로 1~2문장" },
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
- id는 반드시 세계관에 있는 것만 씁니다 (새 관계 id만 예외).
- direct는 정말 직접 닿는 대상만(보통 1~5개), rewrite는 크게 바뀌는 대상만(최대 6개), relations는 실제로 바뀌는 것만(최대 5개).
- reactions는 작가가 다음 장면을 쓸 수 있게 구체적으로 씁니다: 누가 무엇을 잃거나 얻었는지(사람, 지위, 자원, 신뢰 등), 그래서 각자 무엇을 하려 하는지. 직접 연루된 대상뿐 아니라 소속·관계·성격 때문에 흔들리는 인물도 포함합니다. 성격 수치와 관계를 근거로 삼습니다.
- 세계관에서 [행동불가] 표시가 붙은 인물(사망·봉인·혼수 등)은 절대 행동하지 않습니다. reactions에 넣지 않고, 말하거나 움직이거나 결정하는 문장의 주어로 쓰지 않습니다. 남은 사람들이 그 인물을 기억하거나 그 빈자리 때문에 흔들리는 것은 쓸 수 있습니다.
- 사건 내용이 [행동불가] 인물을 움직이게 하면(예: 죽은 인물이 등장), 그 인물이 했다는 행동은 다른 누군가가 했거나 착각·위장일 수 있다고 보고, aftermath 마지막 문장에 "작가 확인 필요: ○○는 세계관상 사망 상태인데 사건에 등장합니다" 식으로 적습니다.`;

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : 0));
}
const r2 = (x: number) => Math.round(x * 100) / 100;

type Raw = { text: string; tokens: number; refused: boolean; stop: string; model: string; detail: string };
/** AI 호출 한 번에 필요한 것: 지시문, 응답 형식, 사용자 입력, 최대 출력 토큰 */
export type Prompt = { system: string; schema: object; user: string; maxTokens: number };

async function callClaude(model: string, { system, schema, user, maxTokens }: Prompt): Promise<Raw> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: AI_TIMEOUT_MS, maxRetries: 0 });
  // 서버측 거절 대체(fallbacks)는 Opus·Fable 계열에서만 켠다
  const fb = /^claude-(opus|fable)/.test(model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {};
  const res = await client.beta.messages.create({
    model,
    max_tokens: maxTokens,
    ...fb,
    output_config: { effort: EFFORT, format: { type: "json_schema", schema: schema as Record<string, unknown> } },
    system,
    messages: [{ role: "user", content: user }],
  });
  return {
    text: res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""),
    tokens: (res.usage.input_tokens ?? 0) + (res.usage.output_tokens ?? 0) + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0),
    detail: `in=${res.usage.input_tokens ?? 0} out=${res.usage.output_tokens ?? 0} cacheRead=${res.usage.cache_read_input_tokens ?? 0} cacheWrite=${res.usage.cache_creation_input_tokens ?? 0}`,
    refused: res.stop_reason === "refusal",
    stop: String(res.stop_reason),
    model: res.model,
  };
}

async function callGemini(model: string, { system, schema, user, maxTokens }: Prompt): Promise<Raw> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model,
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      maxOutputTokens: maxTokens,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      thinkingConfig: { thinkingLevel: EFFORT === "high" ? ThinkingLevel.HIGH : EFFORT === "medium" ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW },
    },
  });
  const finish = res.candidates?.[0]?.finishReason ?? "";
  return {
    text: res.text ?? "",
    tokens: res.usageMetadata?.totalTokenCount ?? 0,
    detail: `in=${res.usageMetadata?.promptTokenCount ?? 0} out=${res.usageMetadata?.candidatesTokenCount ?? 0} think=${res.usageMetadata?.thoughtsTokenCount ?? 0} cacheRead=${res.usageMetadata?.cachedContentTokenCount ?? 0}`,
    refused: !!res.promptFeedback?.blockReason || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(finish),
    stop: String(res.promptFeedback?.blockReason || finish),
    model: res.modelVersion || model,
  };
}

/** 관리자가 고를 수 있는 모델. 키가 등록된 제공사만 보여준다. */
export function adminModels(): { id: string; label: string }[] {
  const has = { claude: !!process.env.ANTHROPIC_API_KEY?.trim(), gemini: !!process.env.GEMINI_API_KEY?.trim() };
  const free = PLAN_MODEL.free.startsWith("gemini:") ? PLAN_MODEL.free : "gemini:gemini-3.8-flash";
  const list = [
    { id: free, label: `Gemini (${free.split(":")[1]})` },
    { id: "claude:claude-haiku-5-5", label: "Claude Haiku 5.5" },
    { id: "claude:claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
    { id: "claude:claude-opus-5-5", label: "Claude Opus 5.5" },
  ];
  return list.filter((m) => has[m.id.split(":")[0] as "claude" | "gemini"]);
}

/** 관리자에게는 사용량 응답에 관리자 표시와 고를 수 있는 모델 목록을 붙인다 */
export function withAdmin<U extends object>(admin: boolean, usage: U): U | (U & { admin: true; models: { id: string; label: string }[] }) {
  return admin ? { ...usage, admin: true as const, models: adminModels() } : usage;
}

/** 관리자가 고른 모델이 목록에 있으면 그 모델로, 아니면 요금제대로 */
/** 상태어로 보아 더는 행동할 수 없는 인물인지 */
export const INACTIVE = /사망|전사|처형|소멸|봉인|활동\s*불가|행동\s*불가|혼수|의식\s*불명|석화/;
export function inactive(x?: { status?: string }): boolean {
  return INACTIVE.test(x?.status ?? "");
}

/** 사건 분석 모델: 깊게 분석이면 Opus, 관리자가 고른 모델이 있으면 그것, 아니면 Sonnet. Claude 키가 없으면 요금제대로. */
export function analyzeRoute(admin: boolean, requested: string | null, plan: Plan, deep: boolean): Route {
  const hasClaude = !!process.env.ANTHROPIC_API_KEY?.trim();
  if (deep) return hasClaude ? (DEEP_MODEL as Route) : plan;
  if (admin && requested) return routeFor(admin, requested, plan);
  return hasClaude ? (ANALYZE_MODEL as Route) : plan;
}

export function routeFor(admin: boolean, requested: string | null, plan: Plan): Route {
  if (!admin || !requested) return plan;
  return adminModels().some((m) => m.id === requested) ? (requested as Route) : plan;
}

/** 요금제에 맞는 모델을 고른다. 그 제공사 키가 없으면 다른 쪽으로 대신한다. */
function pickModel(route: Route): { provider: "claude" | "gemini"; model: string } {
  const has = { claude: !!process.env.ANTHROPIC_API_KEY, gemini: !!process.env.GEMINI_API_KEY };
  if (route.includes(":")) {
    const [p, m] = route.split(":") as ["claude" | "gemini", string];
    if (!has[p]) throw new AiNotConfigured(`${p} 키가 서버에 등록되지 않았습니다`);
    return { provider: p, model: m };
  }
  const plan = route as Plan;
  const [p, m] = PLAN_MODEL[plan].split(":") as ["claude" | "gemini", string];
  if (has[p]) return { provider: p, model: m };
  if (has.gemini) return { provider: "gemini", model: PLAN_MODEL.free.split(":")[1] };
  if (has.claude) return { provider: "claude", model: PLAN_MODEL.pro.split(":")[1] };
  throw new AiNotConfigured("AI 키(GEMINI_API_KEY 또는 ANTHROPIC_API_KEY)가 서버에 등록되지 않았습니다");
}

/** 요금제 모델로 JSON 응답을 받는다. 붐비면 모델을 돌려가며 재시도하고, 거절·형식 오류는 쓴 토큰과 함께 던진다. */
export async function generate<T>(plan: Route, prompt: Prompt, label: string): Promise<{ data: T; tokens: number; model: string; provider: "claude" | "gemini"; detail: string; ms: number }> {
  const { provider, model } = pickModel(plan);
  const user = prompt.user;
  const t0 = Date.now();
  const deadline = t0 + AI_TIMEOUT_MS;
  // 붐빔(503·429)이면 잠깐 쉬고 같은 모델 한 번, 그다음 대체 모델 순서로 시도한다
  // 붐빔(503·429)이면 모델을 돌아가며 기다렸다 다시 시도한다. 성공 1회에 보통 20초 안팎이라 그만큼 남았을 때까지만.
  // 마지막으로 성공한 Gemini 모델부터 시작한다 (같은 서버 인스턴스가 살아 있는 동안 기억)
  const chain = provider === "gemini" ? [...new Set([lastGoodGemini || model, model, ...GEMINI_FALLBACKS])] : [model];
  let res: Raw | undefined;
  let used = model;
  for (let i = 0; !res; i++) {
    used = chain[i % chain.length];
    const left = deadline - Date.now();
    if (left < (i ? 20000 : 3000)) {
      if (i) throw new AiBusy("AI 서버가 지금 붐벼요. 잠시 후 다시 눌러 주세요");
      throw new AiTimeout(`AI 응답이 ${Math.round(AI_TIMEOUT_MS / 1000)}초 안에 오지 않았습니다 (${used})`);
    }
    try {
      // SDK 시간 제한이 안 먹는 경우를 대비해 직접 경주시킨다
      res = await Promise.race([
        (provider === "claude" ? callClaude : callGemini)(used, prompt),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timed out")), left)),
      ]);
      if (provider === "gemini") lastGoodGemini = used;
    } catch (e) {
      const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
      const status = (e as { status?: number }).status;
      if (Date.now() >= deadline - 1000 || /abort|timed? ?out/i.test(msg)) {
        throw new AiTimeout(`AI 응답이 ${Math.round(AI_TIMEOUT_MS / 1000)}초 안에 오지 않았습니다 (${used})`);
      }
      const busy = status === 503 || status === 429 || status === 529 || /\b(503|429|529)\b|high demand|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(msg);
      console.warn(`${label} ${provider}/${used} 실패 (${busy ? "붐빔" : "오류"}, ${Date.now() - t0}ms): ${msg.slice(0, 160)}`);
      if (!busy) throw e;
      if (used === lastGoodGemini) lastGoodGemini = "";
      // 한 바퀴 돌 때마다 더 길게 쉰다: 0.5초, 2초, 4초, 8초
      const round = Math.floor(i / chain.length);
      await new Promise((r) => setTimeout(r, (i + 1) % chain.length ? 500 : Math.min(8000, 2000 * 2 ** round)));
    }
  }
  if (!res) throw new AiBusy("AI 서버가 지금 붐벼요. 잠시 후 다시 눌러 주세요");
  console.log(`${label} ${provider}/${used} ${Date.now() - t0}ms tokens=${res.tokens} ${res.detail} chars=${user.length}`);
  const tokens = res.tokens;
  if (res.refused) throw Object.assign(new AiRefused("AI가 이 요청을 거절했습니다"), { tokens });
  try {
    return { data: JSON.parse(res.text) as T, tokens, model: res.model, provider, detail: res.detail, ms: Date.now() - t0 };
  } catch {
    throw Object.assign(new Error(`AI 응답을 읽지 못했습니다 (${res.stop})`), { tokens });
  }
}

/** 세계관을 줄 단위 표로 바꾼다. JSON의 따옴표·키 이름이 토큰의 절반 가까이를 차지해서, 같은 내용을 짧게 보낸다. */
export function worldText(world: WorldInput): string {
  const one = (t?: string | null) => (t ?? "").replace(/\s+/g, " ").trim();
  const traits = (ts?: { key: string; label: string; value: number; target?: string }[]) =>
    (ts ?? []).map((t) => `${one(t.label)}[${t.key}]=${t.value}${t.target ? `→${t.target}` : ""}`).join(", ") || "-";
  const sit = (x?: { current?: string; status?: string }) => `${one(x?.status) || "-"}: ${one(x?.current) || "-"}`;
  const lines: string[] = [];
  if (world.title) lines.push(`제목: ${one(world.title)}`);
  if (world.background?.length) lines.push("# 배경", ...world.background.map((b) => `- ${one(b.title)}: ${one(b.content)}`));
  lines.push("# 단체 (id 이름 | 상위 | 상태: 현재 | 성향)");
  world.groups.forEach((g) => lines.push(`${g.id} ${one(g.name)} | ${g.parent || "-"} | ${sit(g.situation)} | ${traits(g.traits)}`));
  lines.push("# 인물 (id 이름(별칭) | 소속(역할,유대) | 상태: 현재 | 성향)");
  world.characters.forEach((c) => {
    const aka = c.aliases?.filter(Boolean).length ? `(${c.aliases.filter(Boolean).map(one).join("/")})` : "";
    const ms = (c.memberships ?? []).map((m) => `${m.group}(${[one(m.role), m.bond ?? ""].filter((x) => x !== "").join(",")})`).join(", ") || "-";
    lines.push(`${c.id} ${one(c.name)}${aka}${inactive(c.situation) ? " [행동불가]" : ""} | ${ms} | ${sit(c.situation)} | ${traits(c.traits)}`);
  });
  lines.push("# 관계 (id 출발→도착 종류 강도 메모)");
  world.relations.forEach((r) => lines.push(`${r.id} ${r.from}→${r.to} ${r.type} ${r.intensity}${r.note ? ` ${one(r.note)}` : ""}`));
  if (world.unscored_traits?.length) lines.push(`# relevance를 채울 성향 key: ${world.unscored_traits.join(", ")}`);
  return lines.join("\n");
}

export async function analyzeEvent(event: EventInput, world: WorldInput, plan: Route = "free") {
  const user = `## 세계관\n${worldText(world)}\n\n## 사건\n제목: ${event.title}\n작중 시점: ${event.story_time || "(미정)"}\n내용: ${event.description}`;
  type Out = {
    direct: { target: string; M: number; tags: string[]; summary: string }[];
    relevance: { trait: string; tag: string; rel: number }[];
    rewrite: { id: string; status: string; text: string }[];
    relations: { op: string; id: string; from: string; to: string; type: string; intensity: number; why: string }[];
    aftermath: string;
    reactions: { id: string; involvement: string; impact: string; action: string }[];
  };
  const { data: raw, tokens, model, provider, detail, ms } = await generate<Out>(plan, { system: SYSTEM, schema: SCHEMA, user, maxTokens: 8000 }, "analyze");

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
  // 행동할 수 없는 인물의 "앞으로 어떻게 행동할지"는 버린다 (지시를 어겨도 결과에 남지 않게)
  const gone = new Set(world.characters.filter((c) => inactive(c.situation)).map((c) => c.id));
  const seen = new Set<string>();
  const reactions = (raw.reactions ?? [])
    .filter((x) => ids.has(x.id) && !gone.has(x.id) && !seen.has(x.id) && seen.add(x.id))
    .slice(0, 12)
    .map((x) => ({ id: x.id, involvement: x.involvement === "연루" ? "연루" : "파급", impact: String(x.impact ?? ""), action: String(x.action ?? "") }));
  const aftermath = String(raw.aftermath ?? "");
  return { analysis: { title: event.title, description: event.description, story_time: event.story_time ?? "", aftermath, direct, reactions, relevance, rewrite, relations }, tokens, model, provider, detail, ms };
}
