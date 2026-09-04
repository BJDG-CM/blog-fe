# Cloudflare 배포 · 편집 설정

`blog.yejunlee.com` 을 Cloudflare Pages 로 배포하고, `/admin` 에서 사이트를
직접 편집할 수 있게 만드는 설정 절차입니다.

구조는 이렇습니다.

```
방문자 ──▶ blog.yejunlee.com (Cloudflare Pages, 정적)
                  │
                  ├─ /admin      ── Cloudflare Access 로 잠금
                  └─ /api/*      ── Pages Functions
                                      │
                                      └─▶ GitHub Contents API 로 커밋
                                            └─▶ 푸시가 재빌드를 트리거
```

글은 계속 저장소의 `site/src/content/posts/*.json` 에 파일로 남습니다.
편집 화면은 그 파일을 대신 커밋해 주는 역할만 합니다. 별도의 데이터베이스는
없고, 저장 후 사이트에 반영되기까지 재빌드 시간(보통 1~3분)이 걸립니다.

---

## 1. Pages 프로젝트 만들기

Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**
에서 `BJDG-CM/blog-fe` 를 연결하고 다음 값을 넣습니다.

| 항목 | 값 |
| --- | --- |
| Production branch | `master` |
| Framework preset | None |
| Build command | `yarn workspace blog-site build` |
| Build output directory | `site/dist` |
| Root directory | `/` (비움) |

저장소 루트의 `packageManager` 필드가 `yarn@3.3.1` 이라 Corepack 이 같은
Yarn 버전을 사용합니다. Node 버전은 `.node-version` 파일(22)을 따릅니다.

### 빌드 환경 변수 (Production)

| 이름 | 값 |
| --- | --- |
| `PUBLIC_SITE_URL` | `https://blog.yejunlee.com` |
| `PUBLIC_BASE_PATH` | `/` |

`PUBLIC_PRIVATE_MODE` 는 프라이빗 모드를 쓸 때만 `true` 로 두고,
그때는 `PRIVATE_PASSPHRASE` 도 함께 넣습니다.

---

## 2. 도메인 연결

1. Pages 프로젝트 → **Custom domains → Set up a custom domain** →
   `blog.yejunlee.com`
2. DNS 레코드는 Cloudflare 가 자동으로 만들어 줍니다.
   (`blog` CNAME → `<project>.pages.dev`, 프록시 켜짐)

`yejunlee.com` 루트는 지금처럼 GitHub Pages 를 그대로 두면 됩니다.
서로 다른 호스트라 충돌하지 않습니다.

---

## 3. 편집 API 에 필요한 값

Pages 프로젝트 → **Settings → Variables and Secrets** 에서
**Production 과 Preview 양쪽에** 넣습니다.

| 이름 | 종류 | 값 |
| --- | --- | --- |
| `GITHUB_TOKEN` | Secret | 아래에서 만드는 fine-grained 토큰 |
| `GITHUB_REPO` | Text | `BJDG-CM/blog-fe` |
| `GITHUB_BRANCH` | Text | `master` |
| `GIT_AUTHOR_NAME` | Text | 커밋에 남길 이름 |
| `GIT_AUTHOR_EMAIL` | Text | 커밋에 남길 이메일 |
| `CF_ACCESS_TEAM_DOMAIN` | Text | `<팀이름>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | Text | 4단계에서 받는 Application Audience 태그 |

### GitHub 토큰

GitHub → Settings → Developer settings →
**Personal access tokens → Fine-grained tokens → Generate new token**

- Repository access: **Only select repositories** → `BJDG-CM/blog-fe`
- Repository permissions: **Contents → Read and write** (그 외는 전부 No access)
- 만료일은 짧게 잡고 주기적으로 갱신하는 편이 안전합니다

이 토큰은 저장소 파일을 고칠 수 있으므로 다른 곳에 재사용하지 마세요.

---

## 4. Cloudflare Access 로 편집만 잠그기

Zero Trust 대시보드 → **Access → Applications → Add an application →
Self-hosted**

| 항목 | 값 |
| --- | --- |
| Application name | `blog admin` |
| Session duration | 원하는 값 (예: 24시간) |
| Domain | `blog.yejunlee.com` |
| Path | `admin` |

`/api` 경로에도 같은 방식으로 하나 더 추가합니다. 두 애플리케이션의
**Application Audience (AUD) 태그가 같아야** 하므로, 하나의 애플리케이션에
경로를 두 개 등록하는 편이 간단합니다.

정책은 이렇게 둡니다.

- Policy name: `owner only`
- Action: **Allow**
- Include: **Emails** → 본인 이메일

본문 경로에는 애플리케이션을 만들지 않습니다. 그래야 글은 누구나 로그인
없이 읽고, `/admin` 과 `/api` 만 로그인을 요구합니다.

애플리케이션 개요 화면의 **Application Audience (AUD) Tag** 값을 복사해
3단계의 `CF_ACCESS_AUD` 에 넣고 다시 배포합니다.

> `CF_ACCESS_TEAM_DOMAIN` 또는 `CF_ACCESS_AUD` 가 비어 있으면 편집 API 는
> 요청을 전부 거부합니다. 설정이 빠진 상태로 쓰기 경로가 열리는 것을 막기
> 위한 동작입니다.

---

## 5. 확인

1. 시크릿 창에서 `https://blog.yejunlee.com` — 로그인 없이 보여야 합니다
2. `https://blog.yejunlee.com/admin` — Cloudflare 로그인 화면이 떠야 합니다
3. 로그인 후 글을 하나 고쳐 저장 → 저장소에 커밋이 생기고, 재빌드 후 반영

문제가 생기면 Pages 프로젝트의 **Functions → Real-time Logs** 에서
`/api/*` 요청의 오류 메시지를 볼 수 있습니다.

---

## 6. GitHub Pages 정리 (선택)

`blog.yejunlee.com` 이 정상 동작하는 것을 확인한 뒤에는 기존 GitHub Pages
배포가 더 이상 필요하지 않습니다.

1. `.github/workflows/deploy.yml` 삭제
2. 저장소 **Settings → Pages → Source: None**

지금 당장 지우지 않아도 두 곳이 각자 잘 동작하므로, 새 도메인이 안정된 뒤에
정리하면 됩니다.
