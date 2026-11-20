"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { SHELL_HTML } from "@/legacy/shell";
import { start } from "@/legacy/gitstory";
import { signInWithGoogle, watchUser } from "@/legacy/cloud";

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => watchUser(setUser), []);

  useEffect(() => {
    if (user) start({ uid: user.uid, name: user.displayName || user.email || "사용자", photo: user.photoURL });
  }, [user]);

  if (user === undefined) return null;
  if (user) return <div dangerouslySetInnerHTML={{ __html: SHELL_HTML }} />;

  const login = () => {
    setError("");
    signInWithGoogle().catch((e) => {
      if (e?.code !== "auth/popup-closed-by-user") setError(`로그인하지 못했습니다 (${e?.code || e?.message})`);
    });
  };

  return (
    <main className="nb">
      <nav className="nb-nav" aria-label="GitStory">
        <span className="nb-brand"><img src="/logo.svg" alt="" aria-hidden="true" />GitStory</span>
        <a className="nb-navlink" href="#how">사용법</a>
        <button className="nb-btn nb-btn-sm" type="button" onClick={login}>시작하기</button>
      </nav>

      <section className="nb-hero">
        <p className="nb-eyebrow">제1화 · 설정 노트를 펼치며</p>
        <h1>
          사건 하나가 세계를 바꾸는 순간을,
          <br />
          GitStory가 <mark>기억</mark>합니다
        </h1>
        <p className="nb-sub">
          인물과 단체를 정리하고 사건을 적으면, AI가 누가 어떤 영향을 받는지 분석해 관계도와 설정에 반영해요.
          모든 변화는 버전으로 남아 언제든 비교하고 되돌릴 수 있어요.
        </p>
        <div className="nb-cta">
          <button className="nb-btn" type="button" onClick={login}>Google 계정으로 시작하기</button>
          <a className="nb-btn nb-btn-ghost" href="#how">어떻게 쓰나요</a>
        </div>
        {error && <p className="login-error" role="alert">{error}</p>}
        <ul className="nb-tags">
          <li>설치 없이 브라우저에서</li>
          <li>예시 세계관 3개로 바로 체험</li>
          <li>매일 AI 토큰 지급</li>
        </ul>
        <figure className="nb-shot" aria-hidden="true">
          <span className="nb-tape" />
          <GraphSketch />
        </figure>
      </section>

      <section className="nb-pain">
        <h2>이런 순간, <mark>익숙하지</mark> 않나요?</h2>
        <ul className="nb-notes">
          {PAINS.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p className="nb-hand">그래서 설정을 대신 기억해 주는 노트를 만들었어요.</p>
      </section>

      <section className="nb-rows">
        {ROWS.map(([eyebrow, title, text, kind], i) => (
          <article className={`nb-row${i % 2 ? " nb-flip" : ""}`} key={title}>
            <div className="nb-row-text">
              <p className="nb-eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <div className="nb-card nb-visual" aria-hidden="true">{kind === "impact" ? <ImpactSketch /> : kind === "tree" ? <TreeSketch /> : <MsSketch />}</div>
          </article>
        ))}
      </section>

      <section className="nb-more">
        <h2>그 밖에도 <mark>이런 것</mark>을 해요</h2>
        <div className="nb-grid">
          {FEATURES.slice(4).map(([title, text]) => (
            <div className="nb-card nb-index" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nb-how" id="how">
        <h2>이렇게 써요</h2>
        <ol className="nb-steps">
          <li><b>세계관 정리</b>인물, 단체, 배경과 성격, 소속을 적어요.</li>
          <li><b>사건 입력</b>이야기에서 일어난 일을 적거나 원고를 붙여넣어요.</li>
          <li><b>영향 확인과 기록</b>AI 분석을 확인하고 고친 뒤 버전으로 남겨요.</li>
        </ol>
        <ul className="nb-kinds" aria-label="이런 이야기에 써요">
          {KINDS.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </section>

      <section className="nb-end">
        <h2>작가를 위한 설정 노트</h2>
        <p>
          AI는 글을 대신 쓰지 않아요. 작가가 만든 설정을 기억하고 지켜주는 편집자 역할을 합니다.
          AI가 고른 후보는 작가가 확인하고 반영하기 전까지 세계관을 바꾸지 않아요.
        </p>
        <button className="nb-btn" type="button" onClick={login}>Google 계정으로 시작하기</button>
        <p className="nb-small">로그인하면 하루 일정량의 AI 토큰이 지급됩니다. 예시 세계관(아케인, 해리 포터, 짱구)으로 바로 써 볼 수 있어요.</p>
      </section>

      <footer className="nb-foot">
        <span>© 2026 GitStory</span>
        <Link href="/privacy">개인정보처리방침</Link>
      </footer>
    </main>
  );
}

/* 소개 화면 그림: 실제 화면을 단순하게 그린 스케치 (이미지 파일 없이 SVG) */
function GraphSketch() {
  const nodes: [number, number, string, string, boolean][] = [
    [90, 60, "자운", "#2f9e5b", true], [330, 60, "필트오버", "#c48a12", true], [520, 70, "녹서스", "#6b6f7b", true],
    [120, 170, "징", "#2f9e5b", false], [250, 230, "바", "#2f9e5b", false], [400, 170, "제", "#c48a12", false],
    [450, 260, "케", "#c48a12", false], [560, 200, "암", "#6b6f7b", false],
  ];
  const edges: [number, number, string, number][] = [[0, 1, "#e5484d", 3], [1, 2, "#e08a2c", 2], [3, 4, "#d6409f", 3], [4, 6, "#7c7f8a", 2.2], [5, 7, "#6e56cf", 2], [0, 3, "#9aa0ad", 1], [1, 5, "#9aa0ad", 1], [5, 6, "#9aa0ad", 1]];
  return (
    <svg viewBox="0 0 640 300" role="img">
      <rect x="0" y="0" width="213" height="300" fill="#2f9e5b" opacity=".06" />
      <rect x="213" y="0" width="213" height="300" fill="#c48a12" opacity=".06" />
      <rect x="426" y="0" width="214" height="300" fill="#6b6f7b" opacity=".06" />
      {edges.map(([a, b, c, w], i) => (
        <path key={i} d={`M${nodes[a][0]},${nodes[a][1]} Q${(nodes[a][0] + nodes[b][0]) / 2},${(nodes[a][1] + nodes[b][1]) / 2 - 18} ${nodes[b][0]},${nodes[b][1]}`} fill="none" stroke={c} strokeWidth={w} strokeDasharray={w < 1.5 ? "2 5" : undefined} strokeLinecap="round" />
      ))}
      {nodes.map(([x, y, t, c, g]) => g ? (
        <g key={t}><rect x={x - 46} y={y - 15} width="92" height="30" rx="15" fill="#fff" stroke={c} strokeOpacity=".5" /><rect x={x - 46} y={y - 15} width="92" height="30" rx="15" fill={c} opacity=".12" /><circle cx={x - 30} cy={y} r="3.5" fill={c} /><text x={x + 6} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="#23252d">{t}</text></g>
      ) : (
        <g key={t}><circle cx={x} cy={y} r="18" fill="#fff" /><circle cx={x} cy={y} r="18" fill={c} opacity=".15" stroke={c} /><text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={c}>{t}</text></g>
      ))}
    </svg>
  );
}
function ImpactSketch() {
  const rows: [string, number][] = [["바이", -0.8], ["징크스", -0.55], ["케이틀린", 0.35], ["실코 세력", 0.6]];
  return (
    <div className="nb-impact">
      <div className="nb-impact-h">사건 · 의회 헥스텍 로켓 공격</div>
      {rows.map(([n, v]) => (
        <div className="nb-impact-row" key={n}>
          <span>{n}</span>
          <span className="nb-bar"><i style={{ width: `${Math.abs(v) * 50}%`, ...(v < 0 ? { right: "50%" } : { left: "50%" }), background: v < 0 ? "#e5484d" : "#2f9e5b" }} /></span>
          <b style={{ color: v < 0 ? "#d0393b" : "#21703f" }}>{v > 0 ? "+" : ""}{v.toFixed(2)}</b>
        </div>
      ))}
    </div>
  );
}
function TreeSketch() {
  return (
    <svg viewBox="0 0 320 170" className="nb-tree">
      <path d="M40 20 V150" stroke="#6e56cf" strokeWidth="2.5" />
      <path d="M40 80 C40 100 120 95 120 115 V150" stroke="#e08a2c" strokeWidth="2.5" fill="none" />
      {[20, 50, 80, 110, 140].map((y) => <circle key={y} cx="40" cy={y} r="6" fill="#fff" stroke="#6e56cf" strokeWidth="2.5" />)}
      {[120, 148].map((y) => <circle key={y} cx="120" cy={y} r="6" fill="#fff" stroke="#e08a2c" strokeWidth="2.5" />)}
      <text x="56" y="24" fontSize="12" fill="#23252d">1화 · 세계관 처음 설정</text>
      <text x="56" y="84" fontSize="12" fill="#23252d">3화 · 로켓 공격</text>
      <text x="56" y="144" fontSize="12" fill="#23252d">본편</text>
      <text x="136" y="124" fontSize="12" fill="#c25a12">만약에: 바이가 남았다면</text>
    </svg>
  );
}
function MsSketch() {
  return (
    <div className="nb-ms">
      <p>…징크스는 손에 쥔 로켓을 내려다봤다. <mark>바이</mark>가 돌아오기 전에 끝내야 했다.</p>
      <div className="nb-ms-chips"><span>새 인물 후보 · 이샤</span><span>상황 변화 · 바이: 충격</span><span>새 사건 · 의회 공격</span></div>
    </div>
  );
}

const PAINS = [
  "3화에서 죽은 인물이 7화에 멀쩡히 등장했다",
  "누가 누구 편이었는지 설정집을 뒤적이는 밤",
  "사건 하나 바꿨더니 앞뒤 설정이 줄줄이 어긋난다",
  "'만약 이랬다면?' 써 보고 싶지만 본편이 망가질까 봐",
];
const ROWS: [string, string, string, string][] = [
  ["사건 영향 분석", "사건을 적으면, 누가 얼마나 흔들리는지 보여줘요", "AI가 사건이 직접 닿는 인물과 단체를 고르고, 소속과 성격을 따라 영향이 어떻게 퍼지는지 계산해요. 확인하고 고친 뒤에만 세계관에 반영돼요.", "impact"],
  ["버전과 '만약에' 전개", "모든 변화가 한 줄씩 기록으로 쌓여요", "두 시점을 비교하고, 원하는 시점으로 되돌려요. 지난 시점에서 갈라져 다른 전개를 시험해도 본편은 그대로 남아요.", "tree"],
  ["원고에서 바로", "원고를 붙여넣으면 바뀐 설정을 골라줘요", "한 화씩 붙여넣으면 새 인물, 바뀐 상황, 새 관계, 큰 사건을 후보로 보여줘요. 체크한 것만 반영돼요.", "ms"],
];
const KINDS = ["웹소설", "장편 판타지", "시나리오", "웹툰 스토리", "팬픽", "TRPG 캠페인"];

const FEATURES: [string, string][] = [
  ["사건 영향 분석", "사건이 직접 닿는 인물과 단체를 AI가 판단하고, 소속과 성격을 따라 영향이 어떻게 퍼지는지 계산해요."],
  ["차곡차곡 쌓이는 버전", "사건과 수정이 하나씩 버전으로 쌓여요. 두 시점을 비교하고, 원하는 시점으로 되돌릴 수 있어요."],
  ["'만약에' 전개", "지난 시점에서 갈라져 다른 이야기를 시험해요. 본편은 그대로 남아요."],
  ["원고 붙여넣기", "원고를 한 화씩 붙여넣으면 새 인물, 바뀐 상황, 새 관계, 큰 사건을 후보로 골라줘요."],
  ["관계도", "단체와 인물의 관계를 한눈에 보고, 버전을 골라 그 시점의 관계를 돌아봐요. 화 범위를 고르면 그 화에 나온 인물만 또렷하게 보여요."],
  ["근거를 보여주는 물어보기", "\"3화에서 두 사람은 어떤 사이였지?\"처럼 물으면 원고와 설정, 기록을 읽고 답해요. 답마다 근거가 된 인물, 화, 기록을 눌러 바로 열 수 있어요."],
  ["화별 등장 타임라인", "누가 몇 화에 나왔는지 막대로 보여줘요. 오래 안 나온 인물은 따로 알려줘요."],
  ["원고 옆 설정 카드와 복선 메모", "원고를 쓰면서 그 화에 나온 인물의 설정을 옆에서 확인하고, 복선을 적어 두었다가 회수하면 체크해요."],
];
