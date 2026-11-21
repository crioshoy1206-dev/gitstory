// 공개 설정집(읽기 전용). 작가가 고른 기록 시점의 세계관만 보여준다. 로그인 없이 누구나 볼 수 있다.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { PubWorld } from "@/lib/share";

const KIND: Record<string, string> = { nation: "국가", organization: "조직", faction: "세력", solo: "1인 집단" };
const REL: Record<string, { l: string; c: string; dash?: string }> = {
  hostile: { l: "대립", c: "var(--danger)" }, rival: { l: "경쟁", c: "var(--severe)" },
  coexist: { l: "공존", c: "var(--accent)", dash: "7 5" }, alliance: { l: "동맹", c: "var(--accent)" },
  dominate: { l: "지배", c: "var(--done)" }, family: { l: "가족", c: "var(--sponsor)" }, personal: { l: "개인 관계", c: "var(--fg-muted)" },
};
const PAL = ["var(--accent)", "var(--danger)", "var(--done)", "var(--sponsor)", "var(--severe)", "var(--attention)"];

async function load(id: string) {
  const { getShare } = await import("@/lib/share");
  try {
    return await getShare(id);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata(props: PageProps<"/s/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const s = await load(id);
  return { title: s ? `${s.title} · GitStory 설정집` : "설정집을 찾지 못했어요 · GitStory", robots: { index: false, follow: false } };
}

function rootOf(w: PubWorld, gid: string | null | undefined) {
  let g = w.groups.find((x) => x.id === gid);
  for (let k = 0; g?.parent && k < 10; k++) g = w.groups.find((x) => x.id === g!.parent) || g;
  return g?.id;
}

function Graph({ w }: { w: PubWorld }) {
  const nodes = [...w.groups, ...w.characters];
  if (!nodes.length) return null;
  const pos: Record<string, [number, number]> = { ...w.pos };
  const missing = nodes.filter((n) => !pos[n.id]);
  missing.forEach((n, k) => (pos[n.id] = [Math.round(((k % 8) + 0.5) * (1100 / 8)), 560 + Math.floor(k / 8) * 70]));
  const xs = nodes.map((n) => pos[n.id][0]), ys = nodes.map((n) => pos[n.id][1]);
  const x0 = Math.min(...xs) - 80, y0 = Math.min(...ys) - 50, vw = Math.max(...xs) - x0 + 80, vh = Math.max(...ys) - y0 + 50;
  const roots = w.groups.filter((g) => !g.parent).map((g) => g.id);
  const colorOf = (id: string) => {
    const c = w.characters.find((x) => x.id === id);
    const r = rootOf(w, c ? c.groups[0]?.group : id);
    const i = r ? roots.indexOf(r) : -1;
    return i > -1 ? PAL[i % PAL.length] : "var(--fg-muted)";
  };
  return (
    <div className="pub-gwrap"><svg className="pub-graph" viewBox={`${x0} ${y0} ${vw} ${vh}`} role="img" aria-label="관계도">
      {w.relations.map((r, i) => {
        const a = pos[r.from], b = pos[r.to], t = REL[r.type] || REL.personal;
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        return (
          <g key={i}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: t.c }} strokeWidth={1 + r.intensity * 2.5} strokeDasharray={t.dash} opacity={0.75}>
              <title>{`${t.l}${r.note ? `: ${r.note}` : ""}`}</title>
            </line>
            <text x={mx} y={my - 4} className="pub-rel">{t.l}</text>
          </g>
        );
      })}
      {w.groups.map((g) => {
        const [x, y] = pos[g.id], half = Math.max(30, g.name.length * 8 + 12);
        return (
          <g key={g.id}>
            <rect x={x - half} y={y - 16} width={half * 2} height={32} rx={8} style={{ fill: "var(--bg)", stroke: colorOf(g.id) }} strokeWidth={2} />
            <text x={x} y={y + 5} className="pub-node">{g.name}</text>
          </g>
        );
      })}
      {w.characters.map((c) => {
        const [x, y] = pos[c.id];
        return (
          <g key={c.id} opacity={c.status === "사망" ? 0.45 : 1}>
            <circle cx={x} cy={y - 6} r={12} style={{ fill: colorOf(c.id) }} />
            <text x={x} y={y + 22} className="pub-node">{c.name}</text>
          </g>
        );
      })}
    </svg></div>
  );
}

export default function SharePage(props: PageProps<"/s/[id]">) {
  return (
    <main className="doc pub">
      <Suspense fallback={<p className="caption">설정집을 불러오는 중이에요…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: Pick<PageProps<"/s/[id]">, "params">) {
  const { id } = await params;
  const s = await load(id);
  if (!s) notFound();
  const w = s.world;
  const name = (x: string) => w.groups.find((g) => g.id === x)?.name || w.characters.find((c) => c.id === x)?.name || "";
  const bgCats = [...new Set(w.background.map((b) => b.category || "기타"))];
  return (
    <>
      <p className="caption">GitStory 공개 설정집 · 읽기 전용</p>
      <h1>{s.title}</h1>
      {s.label ? <p className="caption">{s.label} 시점까지의 설정이에요. 이후 전개는 담겨 있지 않아요.</p> : null}

      <Graph w={w} />

      {w.groups.length ? (
        <>
          <h2>단체 <span className="Counter">{w.groups.length}</span></h2>
          <div className="pub-cards">
            {w.groups.map((g) => (
              <section key={g.id} className="pub-card">
                <h3>{g.name} <span className="Label">{KIND[g.kind] || g.kind}</span>{g.status ? <span className="Label">{g.status}</span> : null}</h3>
                {g.parent && name(g.parent) ? <p className="caption">{name(g.parent)} 소속</p> : null}
                {g.current ? <p>{g.current}</p> : null}
              </section>
            ))}
          </div>
        </>
      ) : null}

      {w.characters.length ? (
        <>
          <h2>인물 <span className="Counter">{w.characters.length}</span></h2>
          <div className="pub-cards">
            {w.characters.map((c) => (
              <section key={c.id} className="pub-card">
                <h3>
                  {c.photo ? <img className="pub-photo" src={c.photo} alt="" /> : null}
                  {c.name}{c.status ? <span className="Label">{c.status}</span> : null}
                </h3>
                {c.aliases.length ? <p className="caption">다른 이름: {c.aliases.join(", ")}</p> : null}
                {c.groups.length ? <p className="caption">{c.groups.map((m) => [name(m.group), m.role].filter(Boolean).join(" · ")).filter(Boolean).join(" / ")}</p> : null}
                {c.current ? <p>{c.current}</p> : null}
                {(() => {
                  const rs = w.relations.filter((r) => r.from === c.id || r.to === c.id);
                  return rs.length ? (
                    <ul className="pub-rels">
                      {rs.map((r, i) => (
                        <li key={i}><b>{name(r.from === c.id ? r.to : r.from)}</b> {REL[r.type]?.l || ""}{r.note ? ` · ${r.note}` : ""}</li>
                      ))}
                    </ul>
                  ) : null;
                })()}
              </section>
            ))}
          </div>
        </>
      ) : null}

      {w.background.length ? (
        <>
          <h2>배경 설정</h2>
          {bgCats.map((cat) => (
            <div key={cat}>
              <h3 className="pub-cat">{cat}</h3>
              {w.background.filter((b) => (b.category || "기타") === cat).map((b, i) => (
                <details key={i} className="pub-bg">
                  <summary>{b.title}</summary>
                  <p>{b.content}</p>
                </details>
              ))}
            </div>
          ))}
        </>
      ) : null}

      <p className="caption" style={{ marginTop: 32 }}>
        작가가 직접 고른 내용만 공개돼요. 메모와 인물만 아는 비밀은 담기지 않아요. <Link href="/">GitStory로 나만의 세계관 만들기</Link>
      </p>
    </>
  );
}
