# Cloudflare 배포 · 편집 설정

`blog.yejunlee.com` 이 어떻게 배포되고, `/admin` 편집 기능이 무엇에 의존하는지
정리한 문서입니다. 이미 설정이 끝난 상태이므로, 다시 만들거나 넘겨줄 때
참고하면 됩니다.

## 구조

```
방문자 ──▶ blog.yejunlee.com (Cloudflare Pages)
                  │
                  ├─ /admin      ── Cloudflare Access 로 잠금
                  └─ /api/*      ── Pages Functions
                                      │
                                      └─▶ GitHub Contents API 로 커밋
                                            └─▶ 푸시가 재배포를 트리거

master 푸시 ──▶ GitHub Actions ──▶ 검사 → 빌드 → wrangler pages deploy
```

글은 저장소의 `site/src/content/posts/*.json` 에 파일로 남습니다. 편집 화면은
그 파일을 대신 커밋해 주는 역할만 하고, 별도의 데이터베이스는 없습니다.
저장 후 사이트에 반영되기까지 재빌드 시간(보통 1~3분)이 걸립니다.

---

## 1. Pages 프로젝트

| 항목 | 값 |
| --- | --- |
| 프로젝트 이름 | `blog-fe` |
| 기본 도메인 | `blog-fe-ddv.pages.dev` |
| 커스텀 도메인 | `blog.yejunlee.com` |
| 배포 방식 | Direct upload (GitHub Actions 에서 업로드) |
| 프로덕션 브랜치 | `master` |
| DNS | `blog` CNAME → `blog-fe-ddv.pages.dev` (프록시 켜짐) |

Git 연결형이 아니라 **direct upload** 프로젝트입니다. 빌드는 GitHub Actions 가
맡고, `wrangler pages deploy` 로 결과물만 올립니다. 덕분에 배포 전에 lint ·
타입 검사 · 테스트를 강제할 수 있습니다.

만약 Cloudflare 가 직접 빌드하도록 바꾸고 싶다면 대시보드에서 프로젝트를
지우고 **Connect to Git** 으로 다시 만들어야 합니다. 그 경우 빌드 명령은
`yarn workspace blog-site build`, 출력 디렉터리는 `site/dist` 입니다.

---

## 2. 배포 워크플로

`.github/workflows/deploy-cloudflare.yml` 이 `master` 푸시마다 실행됩니다.

필요한 값:

| 위치 | 이름 | 설명 |
| --- | --- | --- |
| GitHub Secret | `CLOUDFLARE_API_TOKEN` | `Cloudflare Pages: Edit` 권한만 가진 토큰 |
| GitHub Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |

빌드 시 환경 변수는 워크플로 안에 직접 적혀 있습니다.

```yaml
PUBLIC_SITE_URL: https://blog.yejunlee.com
PUBLIC_BASE_PATH: "/"
```

프라이빗 모드를 쓸 때만 저장소 변수 `PRIVATE_MODE` 를 `true` 로 두고,
시크릿 `PRIVATE_PASSPHRASE` 를 함께 등록합니다.

`.github/workflows/deploy.yml` 은 기존 `yejunlee.com/blog-fe/` 를 유지하기 위해
남아 있습니다. 새 도메인이 안정되면 지워도 됩니다.

---

## 3. 편집 API 환경 변수

Pages 프로젝트 → **Settings → Variables and Secrets** (Production).

| 이름 | 종류 | 값 |
| --- | --- | --- |
| `GITHUB_TOKEN` | Secret | fine-grained PAT (아래 참고) |
| `GITHUB_REPO` | Text | `BJDG-CM/blog-fe` |
| `GITHUB_BRANCH` | Text | `master` |
| `GIT_AUTHOR_NAME` | Text | 커밋에 남길 이름 |
| `GIT_AUTHOR_EMAIL` | Text | 커밋에 남길 이메일 |
| `CF_ACCESS_TEAM_DOMAIN` | Text | `winter-snow-cbb8.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | Text | Access 애플리케이션의 AUD 태그 |

### GitHub 토큰

GitHub → Settings → Developer settings →
**Personal access tokens → Fine-grained tokens**

- Repository access: **Only select repositories** → `BJDG-CM/blog-fe`
- Repository permissions: **Contents → Read and write** (그 외 전부 No access)

이 토큰은 저장소 파일을 고칠 수 있으므로 다른 곳에 재사용하지 마세요.
만료되면 편집 저장이 실패하므로, 갱신 후 Pages 시크릿을 다시 넣어야 합니다.

---

## 4. Cloudflare Access

Zero Trust → **Access → Applications → Self-hosted**

| 항목 | 값 |
| --- | --- |
| Application name | `blog admin` |
| Type | Self-hosted |
| Destinations | `blog.yejunlee.com/admin`, `blog.yejunlee.com/api` |
| Session duration | 24h |

경로 두 개를 **하나의 애플리케이션**에 등록했습니다. 그래야 AUD 태그가 하나라
`CF_ACCESS_AUD` 도 하나로 끝납니다. 팀 도메인은
`winter-snow-cbb8.cloudflareaccess.com` 입니다.

정책은 이렇게 둡니다.

- Action: **Allow**
- Include: **Emails** → 본인 이메일

본문 경로에는 애플리케이션을 만들지 않습니다. 그래야 글은 누구나 로그인 없이
읽고, `/admin` 과 `/api` 만 로그인을 요구합니다.

> `CF_ACCESS_TEAM_DOMAIN` 또는 `CF_ACCESS_AUD` 가 비어 있으면 편집 API 는
> 요청을 전부 거부합니다. 설정이 빠진 상태로 쓰기 경로가 열리는 것을 막기
> 위한 동작이라, 값을 넣고 재배포해야 편집이 켜집니다.

---

## 5. 확인

1. 시크릿 창에서 `https://blog.yejunlee.com` — 로그인 없이 보여야 합니다
2. `https://blog.yejunlee.com/admin` — Cloudflare 로그인 화면이 떠야 합니다
3. 로그인 후 글을 고쳐 저장 → 저장소에 커밋이 생기고, 재배포 후 반영

로그인하지 않은 상태에서 기대되는 응답입니다.

```
/  /posts/  /rss.xml  /robots.txt   200
/admin/  /api/*                     302 → winter-snow-cbb8.cloudflareaccess.com
```

`/api/*` 가 `500` 과 함께 Access 설정 안내를 주면 3번 표의 환경 변수가 빠진
상태이고, `200` 을 주면 Access 애플리케이션 경로가 잘못된 것입니다.

문제가 생기면 Pages 프로젝트의 **Functions → Real-time Logs** 에서 `/api/*`
요청의 오류 메시지를 볼 수 있습니다.
