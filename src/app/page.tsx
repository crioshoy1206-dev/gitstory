"use client";

import { useEffect, useState } from "react";
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
    <main className="login">
      <div className="logo" aria-hidden="true">G</div>
      <h1>GitStory</h1>
      <p className="muted">세계관을 커밋처럼 쌓아 가는 AI 스토리 창작 도구</p>
      <button className="btn btn-primary" type="button" onClick={login}>
        Google 계정으로 시작하기
      </button>
      {error && <p className="login-error" role="alert">{error}</p>}
      <p className="caption">로그인하면 하루 일정량의 AI 토큰이 지급됩니다.</p>
    </main>
  );
}
