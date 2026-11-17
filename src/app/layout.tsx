import type { Metadata } from "next";
import "./gitstory.css";

export const metadata: Metadata = {
  title: "GitStory",
  description: "세계관을 버전 관리하는 AI 스토리 창작 보조 도구",
  applicationName: "GitStory",
  appleWebApp: { capable: true, title: "GitStory", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#f5f5f7" };

// 저장해 둔 테마(원고지·밤의 서고·작업 노트, 밝게·어둡게)를 화면이 그려지기 전에 적용한다
// 2026-11 새 기본 디자인(스튜디오): 예전 기본값 '원고지'를 쓰던 사람은 한 번 스튜디오로 옮긴다
const THEME_BOOT = `try{var s=localStorage.getItem("gitstory-skin"),m=localStorage.getItem("gitstory-mode"),r=document.documentElement;if(localStorage.getItem("gitstory-design")!=="2"){if(s==="paper"){s="studio";localStorage.setItem("gitstory-skin",s)}localStorage.setItem("gitstory-design","2")}if(s==="night"||s==="note"||s==="paper")r.dataset.skin=s;if(m==="light"||m==="dark")r.dataset.theme=m}catch(e){}`;
const FONTS =
  "https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;600;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Gothic+A1:wght@400;500;600;800&family=Gowun+Batang:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Gaegu:wght@400;700&family=Cinzel+Decorative:wght@700&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
