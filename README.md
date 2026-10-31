# GitStory

세계관(배경·단체·인물)을 구조화해 입력하고, 사건이 생길 때마다 AI가 영향을 반영해 git 커밋처럼 버전으로 쌓는 스토리 창작 보조 앱. 상업 서비스를 목표로 개발 중.

## 지금 상태 (샘플)
- 예시 세계관 3개(아케인, 해리 포터, 짱구는 못말려)로 세계관 편집, 사건 입력, 관계도, 버전 기록(비교, 되돌리기)이 동작한다.
- 변경 내용은 브라우저(localStorage)에 저장된다. "처음 상태로" 버튼으로 예시 초기 상태로 되돌린다.
- 사건 분석은 `/api/analyze`에서 AI가 판단한다(직접 영향·반응도·상황 문장·관계 변화). 숫자 전파는 브라우저가 계산. 요금제별 모델: 무료 = Gemini(`GEMINI_API_KEY`, 기본 gemini-3.8-flash), 유료 = Claude(`ANTHROPIC_API_KEY`, 기본 claude-sonnet-5-5). `AI_MODEL_FREE`/`AI_MODEL_PRO`("제공사:모델")와 `AI_EFFORT`(기본 low)로 조정. 한쪽 키만 있으면 그쪽으로 대신하고, 둘 다 없거나 실패하면 키워드 추정. 요금제는 Firestore `users/{uid}.plan`("pro"면 유료, 결제 연결 전까지 콘솔에서 지정).
- 버전 기록은 커밋 트리로 보이고, 과거 커밋에서 '만약에' 갈래(branch)를 만들 수 있다. 저장 형식은 `{state, commits(모든 갈래), branches, branch, pending, layout}`이고, 갈래 정보가 없는 예전 저장본은 main(화면 이름 '본편') 하나로 읽는다. 합치기는 아직 없다.
- 화면에서는 커밋을 '기록', 갈래를 '전개'라고 부른다. 세계관을 직접 고치면 render 때 `flushPending`이 바로 '세계관 직접 수정' 기록으로 남기고, 30분 안이면 맨 끝 자동 기록에 이어 붙인다(그 뒤로 갈라진 전개가 없을 때만).
- 성격·소속감·관계 세기는 약함/보통/강함/아주 강함(0.25/0.5/0.75/1)으로 고른다. 인물·단체에는 `notes`(메모)와 `photo`(160px JPEG data URL)가 있다.
- 지우기는 `op:'remove'` patch로 기록한다. 인물·단체를 지우면 이어진 관계, 그 단체의 소속, 하위 단체의 상위 연결도 함께 정리하고(`removeEntity`), 알림의 되돌리기는 지운 것을 다시 추가하는 patch로 되살린다(`restore`). 같은 이름(다른 이름 포함)은 만들기 전에 묻고, 원고 후보에서는 기본으로 체크를 끈다.
- 관계도에서 끌어 옮긴 위치는 `layout`에 저장하고 버전과 무관하다. 버전 기록에는 이야기 흐름, 타임라인(인물별로 거르기), 비교·되돌리기 세 가지 보기가 있다.
- 원고 붙여넣기: `/api/extract`가 원고 한 화(최대 12,000자)에서 새 인물·단체, 상황 변화, 새 관계, 사건 후보를 뽑는다. 원고 원문은 저장하지 않는다.
- 로그인 전 첫 화면은 소개 페이지, `/privacy`는 개인정보처리방침. 처음 로그인하면 사용 안내가 뜨고, 헤더의 도움말로 다시 볼 수 있다.
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
