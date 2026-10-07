import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>GitStory</h1>
      <p>세계관을 버전 관리하는 AI 스토리 창작 보조 도구</p>
    </main>
  );
}
