# 개인 블로그 (Astro + Tiptap)

**https://blog.yejunlee.com**

정적 블로그 사이트(`/site`)와 로컬 작성도구(`/authoring`)로 구성됩니다.
글은 `site/src/content/posts/*.json` 에 파일로 저장되고, `master` 에 push 되면
자동으로 빌드·배포됩니다. 데이터베이스는 없고 저장소가 곧 콘텐츠 저장소입니다.

글을 쓰는 방법은 두 가지입니다.

- **사이트에서 바로** — 로그인한 상태로 글을 읽다가 **편집** 버튼(또는 `e` 키,
  ⌘K → `이 글 편집`)을 누르면 그 글이 편집기에 열립니다. 저장하면 저장소에
  커밋됩니다. Cloudflare Access 로 잠겨 있어 본문은 누구나 읽지만 편집은
  로그인이 필요하고, 로그인하지 않은 방문자에게는 편집 진입점이 아예
  보이지 않습니다. 설정 절차는
  [docs/cloudflare-setup.md](docs/cloudflare-setup.md) 를 보세요.
- **로컬 작성도구** — `yarn author` 로 띄워 파일로 저장한 뒤 직접 커밋합니다.

## 폴더 구조

```
/site        # 배포 대상 Astro 정적 사이트
/authoring   # 로컬 작성 UI + 로컬 파일 저장 서버
/functions   # Cloudflare Pages Functions (사이트 편집 API)
/lib         # Functions 가 쓰는 공용 모듈 (인증 · GitHub · 입력 검증)
/.github     # GitHub Actions 워크플로우
```

## 주요 기능

- **커맨드 팔레트 검색** — 어느 페이지에서든 <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> / <kbd>/</kbd>
  로 열립니다. 제목·요약·태그는 물론 본문까지 검색하고 매칭 부분을 강조합니다.
  색인은 빌드 시점에 만들어져 페이지에 함께 실리므로 네트워크 요청이 없습니다.
- **글 목록 필터** — 검색어 + 태그 칩 + 정렬(최신순/오래된순/읽는 시간순).
  선택한 조건은 쿼리스트링(`?q=&tag=`)에 반영돼 그대로 공유할 수 있습니다.
- **목차와 읽기 진행률** — 본문 헤딩에서 목차를 자동 생성하고,
  IntersectionObserver로 현재 읽는 위치를 표시합니다.
- **코드 하이라이팅** — 빌드 시 Shiki로 처리하며, 라이트/다크 두 테마를 CSS 변수로
  동시에 심어 테마 전환 시 다시 칠하지 않습니다. 블록마다 복사 버튼이 붙습니다.
- **테마** — 라이트 / 다크 / 시스템 3단 전환. 첫 페인트 전에 결정돼 깜빡임이 없습니다.
- **탐색 보조** — 태그 유사도 기반 관련 글, 이전·다음 글, 아카이브(연도별 타임라인),
  링크 복사·SNS 공유, 맨 위로 버튼, 이미지 라이트박스.
- **SEO** — 페이지별 메타/OG 태그, JSON-LD 구조화 데이터, `rss.xml`, `sitemap.xml`,
  `robots.txt` 자동 생성.
- **뷰 트랜지션** — 페이지 이동 시 부드럽게 전환되고, 뷰포트에 들어온 링크는 미리 받아둡니다.

## 페이지

| 경로            | 설명                                  |
| --------------- | ------------------------------------- |
| `/`             | 홈 (대표 글 · 최근 글 · 태그)         |
| `/posts`        | 전체 글 + 검색/태그/정렬 필터         |
| `/posts/[slug]` | 글 상세 (목차 · 관련 글 · 공유)       |
| `/tags`         | 태그 목록                             |
| `/tags/[tag]`   | 태그별 글                             |
| `/archive`      | 연도별 아카이브                       |
| `/about`        | 소개                                  |
| `/admin`        | 글 쓰기 (Cloudflare Access 로 잠금)   |

사이트 이름·소개·메뉴·소셜 링크는 [`site/src/config.ts`](site/src/config.ts) 한 곳에서
관리합니다.

## 글 메타데이터

`site/src/content/posts/*.json` 의 `meta` 필드:

| 필드       | 필수 | 설명                                    |
| ---------- | ---- | --------------------------------------- |
| `title`    | ✓    | 글 제목                                 |
| `date`     | ✓    | 발행일 (`YYYY-MM-DD`)                   |
| `tags`     | ✓    | 태그 배열                               |
| `summary`  |      | 요약. 없으면 본문 앞부분을 잘라 씁니다  |
| `updated`  |      | 수정일                                  |
| `featured` |      | `true` 면 홈 상단에 대표 글로 노출      |
| `draft`    |      | `true` 면 빌드에서 제외                 |

## 요구사항

- Node 22+
- Yarn 3 (저장소에 포함되어 있어 Corepack 이 자동으로 씁니다)

## 실행 방법

```bash
yarn install
yarn author      # 작성 UI + 로컬 서버 (http://localhost:5174)
yarn dev         # 사이트 개발 서버 (http://localhost:4321)
yarn build       # 정적 빌드 (site/dist)
yarn lint        # ESLint
yarn typecheck   # 사이트 + Functions 타입 검사
yarn test        # Vitest
```

## 배포

`blog.yejunlee.com` 은 Cloudflare Pages 가 `master` 를 빌드해 배포합니다.
빌드 설정과 편집 API 에 필요한 환경 변수, Cloudflare Access 정책은
[docs/cloudflare-setup.md](docs/cloudflare-setup.md) 에 정리해 두었습니다.

`.github/workflows/deploy.yml` 은 기존 `yejunlee.com/blog-fe/` 를 유지하기 위해
남아 있습니다. 새 도메인이 안정되면 지워도 됩니다.

## 프라이빗 모드

- `PUBLIC_PRIVATE_MODE=true`일 때 빌드 시 글 본문이 AES-GCM으로 암호화되어 배포됩니다.
- 방문자는 패스프레이즈를 입력해 복호화합니다.
- **주의:** 정적 사이트의 완전한 접근통제는 불가능하며, 평문 노출 방지를 위한 보호용입니다.

## 작성 워크플로우

**사이트에서 편집할 때**

1. 로그인 (처음 한 번만. 세션은 24시간 유지됩니다)
2. 고칠 글에서 **편집** 버튼 · `e` 키 · ⌘K → `이 글 편집`
   새 글은 ⌘K → `새 글 쓰기` 또는 목록에서 `새 글`
3. 제목 · 발행일 · 태그 · 요약을 채우고 본문 작성
   주소(slug)는 비우면 제목에서 자동으로 만들고, 직접 넣어도 됩니다
4. 저장 (⌘S) → 저장소에 커밋되고 재배포 → 1~3분 뒤 반영

초안으로 두려면 **비공개(초안)**, 홈 상단에 크게 띄우려면 **홈 대표 글** 을
체크합니다. 발행된 글의 주소는 링크가 깨지지 않도록 고정됩니다.

**로컬 작성도구를 쓸 때**

1. `yarn author` 로 작성 UI 실행
2. 글 작성/이미지 첨부 → 파일로 저장
3. `git add/commit/push` → 자동 배포

## 라이선스

MIT
