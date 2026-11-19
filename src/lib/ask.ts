// 물어보기: 원고·세계관·기록·메모를 읽고 작가의 질문에 답한다. 답마다 근거(인물·단체·배경, 화, 기록)를 붙인다.
// 원고와 세계관은 고치지 않는다. 원고 원문은 저장하지 않는다.
import "server-only";
import { generate, type Plan } from "@/lib/analyze";

/** 질문 하나에 보낼 수 있는 자료 크기 (글자) */
export const ASK_MAX_CHARS = 60000;
/** 물어보기 한 번에 필요하다고 보고 미리 확인하는 토큰 양 */
export const ASK_ESTIMATE = 5000;

export type AskInput = {
  question: string;
  quote?: string;
  world: unknown;
  notes?: { id: string; name: string; notes: string }[];
  chapters?: { id: string; title: string; text: string; memos?: string[] }[];
  commits?: { id: string; n: number; message: string; story_time?: string; description?: string }[];
  ids: string[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "sources"],
  properties: {
    answer: { type: "string", description: "질문에 대한 답. 한국어, 3~8문장. 자료에 없으면 없다고 말한다." },
    sources: {
      type: "array",
      description: "답의 근거가 된 자료. 자료에 실제로 있는 id만 쓴다. 0~6개",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "why", "from_notes"],
        properties: {
          id: { type: "string", description: "인물·단체·배경 id, 화 id(ch_...), 또는 기록 id" },
          why: { type: "string", description: "이 자료에서 무엇을 근거로 삼았는지, 짧게" },
          from_notes: { type: "boolean", description: "작가 메모(설정 메모·복선 메모)에서 가져온 내용이면 true" },
        },
      },
    },
  },
} as const;

const SYSTEM = `당신은 작가의 원고와 세계관 설정집을 모두 읽은 편집자입니다. 작가의 질문에 답합니다.
- 주어진 자료(세계관, 원고, 기록, 메모)에 있는 내용만으로 답하고, 짐작으로 지어내지 않습니다. 자료에 없으면 "자료에서 찾지 못했어요"라고 말합니다.
- 작가 메모에서 온 내용은 원고에 쓰인 사실과 구분해 "메모에 따르면"처럼 밝힙니다.
- 원고를 대신 쓰거나 고쳐 쓰지 않습니다. 설정이 서로 어긋나 보이면 짚어 줍니다.
- 근거마다 자료의 id를 sources에 넣습니다.
- 존댓말(해요체)로 짧고 분명하게 씁니다.`;

export async function askWorld(input: AskInput, plan: Plan = "free") {
  const parts = [`## 세계관\n${JSON.stringify(input.world)}`];
  if (input.notes?.length) parts.push(`## 작가 설정 메모\n${JSON.stringify(input.notes)}`);
  if (input.commits?.length) parts.push(`## 기록(사건 순서)\n${JSON.stringify(input.commits)}`);
  if (input.chapters?.length) parts.push(`## 원고\n${input.chapters.map((c) => `### [${c.id}] ${c.title}\n${c.text}${c.memos?.length ? `\n(복선 메모: ${c.memos.join(" / ")})` : ""}`).join("\n\n")}`);
  parts.push(input.quote ? `## 작가가 고른 문장\n${input.quote}\n\n## 질문\n${input.question}` : `## 질문\n${input.question}`);
  const { data, tokens, model, provider } = await generate<{ answer: string; sources: { id: string; why: string; from_notes: boolean }[] }>(
    plan,
    { system: SYSTEM, schema: SCHEMA, user: parts.join("\n\n"), maxTokens: 2000 },
    "ask",
  );
  const ids = new Set(input.ids);
  const seen = new Set<string>();
  const sources = (data.sources || [])
    .filter((s) => ids.has(s.id) && !seen.has(s.id) && seen.add(s.id))
    .slice(0, 6)
    .map((s) => ({ id: s.id, why: String(s.why || "").slice(0, 120), from_notes: !!s.from_notes }));
  return { result: { answer: String(data.answer || "").trim(), sources }, tokens, model, provider };
}
