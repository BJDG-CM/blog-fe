# npm 설치 진단 로그

## 버전
- node: v22.21.1
- npm: 11.4.2

## 레지스트리
- registry: https://registry.npmjs.org/

## 주요 에러 라인 (npm install --verbose)
```
npm http fetch GET 403 https://registry.npmjs.org/@tiptap%2fcore 45ms (cache skip)
```

## 네트워크 확인
```
curl: (56) CONNECT tunnel failed, response 403
HTTP/1.1 403 Forbidden
```
