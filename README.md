# GitStory

세계관(배경·단체·인물)을 구조화해 입력하고, 사건이 생길 때마다 AI가 영향을 반영해 git 커밋처럼 버전으로 쌓는 스토리 창작 보조 앱. 2026 SNU X Croche AI 앱 해커톤 출품작.

## 지금 상태 (샘플)
- 예시 세계관 3개(아케인, 해리 포터, 짱구는 못말려)로 세계관 편집, 사건 입력, 관계도, 버전 기록(비교, 되돌리기)이 동작한다.
- 변경 내용은 브라우저(localStorage)에 저장된다. "처음 상태로" 버튼으로 예시 초기 상태로 되돌린다.
- 사건 분석은 `/api/analyze`에서 Claude가 판단한다(직접 영향·반응도·상황 문장·관계 변화). 숫자 전파는 브라우저가 계산. Vercel 환경변수 `ANTHROPIC_API_KEY` 필요, `ANTHROPIC_MODEL`(기본 claude-opus-5-5)·`ANTHROPIC_EFFORT`(기본 low)로 조정. 키가 없거나 실패하면 키워드 추정으로 대신한다.
- 화면 로직은 `src/legacy/gitstory.js`(프로토타입 스크립트 이식), 예시 데이터는 `src/data/`.

## 스택
- Next.js (App Router, TypeScript)
- Firebase (Firestore, Auth), 프로젝트 `gitstory-snu-2026`
- Vercel 배포

## 빌드 참고
- `npm run build`는 webpack으로 빌드한다(`next build --webpack`). Turbopack 빌드는 firebase-admin을 해시 붙은 이름으로 불러와 Vercel 함수에서 500 오류가 났다.
- 서버 API(`/api/*`)는 Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT`(서비스 계정 키 JSON 전체)가 필요하다.

## 로컬 실행
```bash
cp .env.example .env.local
npm install
npm run dev
```
