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
    <main className="landing">
      <section className="hero">
        <div className="logo" aria-hidden="true">G</div>
        <h1>사건 하나가 세계를 어떻게 바꾸는지, GitStory가 기억합니다</h1>
        <p>
          창작자를 위한 세계관 관리 도구예요. 인물과 단체를 정리하고 사건을 입력하면, AI가 누가 어떤 영향을 받는지 분석해
          관계도와 설정에 반영합니다. 모든 변화는 버전으로 남아 언제든 비교하고 되돌릴 수 있어요.
        </p>
        <button className="btn btn-primary" type="button" onClick={login}>
          Google 계정으로 시작하기
        </button>
        {error && <p className="login-error" role="alert">{error}</p>}
        <p className="caption">로그인하면 하루 일정량의 AI 토큰이 지급됩니다. 예시 세계관(아케인, 해리 포터, 짱구)으로 바로 써 볼 수 있어요.</p>
      </section>

      <h2>무엇을 할 수 있나요</h2>
      <div className="features">
        {FEATURES.map(([title, text]) => (
          <div className="Box" key={title}>
            <div className="Box-body">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>이렇게 써요</h2>
      <ol className="steps">
        <li><b>세계관 정리</b>인물, 단체, 배경과 성격, 소속을 적어요.</li>
        <li><b>사건 입력</b>이야기에서 일어난 일을 적거나 원고를 붙여넣어요.</li>
        <li><b>영향 확인과 기록</b>AI 분석을 확인하고 고친 뒤 버전으로 남겨요.</li>
      </ol>

      <p className="caption" style={{ textAlign: "center", marginBottom: 32 }}>
        AI는 글을 대신 쓰지 않아요. 작가가 만든 설정을 기억하고 지켜주는 편집자 역할을 합니다.
      </p>

      <footer>
        <span>© 2026 GitStory</span>
        <Link href="/privacy">개인정보처리방침</Link>
      </footer>
    </main>
  );
}

const FEATURES: [string, string][] = [
  ["사건 영향 분석", "사건이 직접 닿는 인물과 단체를 AI가 판단하고, 소속과 성격을 따라 영향이 어떻게 퍼지는지 계산해요."],
  ["차곡차곡 쌓이는 버전", "사건과 수정이 하나씩 버전으로 쌓여요. 두 시점을 비교하고, 원하는 시점으로 되돌릴 수 있어요."],
  ["'만약에' 전개", "지난 시점에서 갈라져 다른 이야기를 시험해요. 본편은 그대로 남아요."],
  ["원고 붙여넣기", "원고를 한 화씩 붙여넣으면 새 인물, 바뀐 상황, 새 관계, 큰 사건을 후보로 골라줘요."],
  ["관계도", "단체와 인물의 관계를 한눈에 보고, 버전을 골라 그 시점의 관계를 돌아봐요."],
];
