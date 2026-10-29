import type { Metadata } from "next";
import "./gitstory.css";

export const metadata: Metadata = {
  title: "GitStory",
  description: "세계관을 버전 관리하는 AI 스토리 창작 보조 도구",
};

// 저장해 둔 테마(원고지·밤의 서고·작업 노트, 밝게·어둡게)를 화면이 그려지기 전에 적용한다
const THEME_BOOT = `try{var s=localStorage.getItem("gitstory-skin"),m=localStorage.getItem("gitstory-mode"),r=document.documentElement;if(s==="night"||s==="note")r.dataset.skin=s;if(m==="light"||m==="dark")r.dataset.theme=m}catch(e){}`;
const FONTS =
  "https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;600;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Gothic+A1:wght@400;500;600;800&family=Gowun+Batang:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
