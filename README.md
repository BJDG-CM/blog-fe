# 개인 블로그 (GitHub Pages + Astro + Tiptap)

이 레포는 **정적 블로그 사이트(/site)** 와 **로컬 전용 작성도구(/authoring)** 로 구성됩니다. 작성도구에서 글과 이미지를 저장하면 `/site` 콘텐츠에 파일로 저장되고, `main` 브랜치에 push 되면 GitHub Actions가 자동 배포합니다.

## 폴더 구조

```
/site        # 배포 대상 Astro 정적 사이트
/authoring   # 로컬 작성 UI + 로컬 파일 저장 서버
/.github     # GitHub Actions 워크플로
```

## 요구사항

- Node 20+
- npm 사용

## 실행 방법

```bash
npm install
npm run author   # 작성 UI + 로컬 서버 (http://localhost:5174)
npm run dev      # 사이트 개발 서버 (http://localhost:4321)
```

## 배포 설정 (GitHub Pages)

1. Repo Settings → Pages → Source: **GitHub Actions** 선택
2. `PRIVATE_PASSPHRASE`(프라이빗 모드 암호) 를 GitHub Secrets에 등록
3. 필요 시 `PRIVATE_MODE` 변수를 `true` 로 설정 (Repository → Settings → Environments → Variables)

## 프라이빗 모드

- `PUBLIC_PRIVATE_MODE=true`일 때 빌드 시 글 본문이 AES-GCM으로 암호화되어 배포됩니다.
- 방문자는 패스프레이즈를 입력해 복호화합니다.
- **주의:** 정적 사이트의 완전한 접근통제는 불가능하며, 평문 노출 방지를 위한 보호용입니다.

## 작성 워크플로

1. `npm run author` 로 작성 UI 실행
2. 글 작성/이미지 첨부 → 자동 저장
3. `git add/commit/push` → GitHub Actions가 자동 배포

## 라이선스

MIT
