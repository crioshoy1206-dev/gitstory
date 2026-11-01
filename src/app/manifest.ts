import type { MetadataRoute } from "next";

// 홈 화면에 추가하거나 앱처럼 고정했을 때 쓰는 이름과 아이콘
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GitStory",
    short_name: "GitStory",
    description: "세계관을 버전 관리하는 AI 스토리 창작 보조 도구",
    start_url: "/",
    display: "standalone",
    background_color: "#141a18",
    theme_color: "#141a18",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
