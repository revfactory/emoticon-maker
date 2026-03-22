# Emoticon Maker

사진 한 장으로 이모티콘 24종 세트를 자동 생성하는 서버리스 웹 서비스.

## 소개

인물 사진을 업로드하면 AI가 다양한 스타일(지브리풍, 병맛 스케치, 미니멀 라인, 귀여운 3D, 애니메이션 등)을 제안하고, 선택한 스타일로 베이스 캐릭터를 생성한 후 24개 감정/상황 이모티콘을 자동 생성합니다. 완성된 세트는 미리보기 페이지에서 확인하고 ZIP으로 다운로드할 수 있습니다.

별도 백엔드 서버 없이 브라우저에서 Google Gemini API를 직접 호출하며, GitHub Pages에서 정적 호스팅됩니다.

## 주요 기능

- **AI 스타일 선택** — 5종 프리셋 + AI 추천 스타일 + 직접 입력
- **베이스 캐릭터 생성** — 업로드한 사진 기반으로 캐릭터화
- **이모티콘 24종 자동 생성** — 시트(3x2 그리드) 생성 후 Canvas API로 개별 분할
- **투명 배경 처리** — 360x360 PNG 투명배경 변환
- **메인/탭 이미지 자동 생성** — 메인(240x240) + 탭(96x74)
- **ZIP 다운로드** — 전체 세트 일괄 다운로드
- **IndexedDB 캐싱** — 페이지 새로고침에도 생성 결과 유지
- **반응형 레이아웃** — 모바일/데스크톱 대응

## 사전 요구사항

- 모던 브라우저 (Chrome 90+, Safari 15+, Firefox 90+)
- [Google Gemini API 키](https://aistudio.google.com/apikey)

## 실행 방법

빌드 과정이 필요 없습니다. 정적 파일을 웹 서버로 서빙하면 됩니다.

```bash
# 로컬 서버 예시
npx serve .
```

브라우저에서 접속한 후 Gemini API 키를 입력하면 바로 사용할 수 있습니다.
API 키는 브라우저 sessionStorage에만 저장되며 서버로 전송되지 않습니다.

## 파일 구조

```
index.html   — HTML 마크업
style.css    — 스타일시트
app.js       — 애플리케이션 로직 (ES Module)
```

## 기술 스택

- Vanilla JavaScript (ES2022+, ES Module)
- CSS Custom Properties
- Google Gen AI SDK (`@google/genai`) — Gemini API 클라이언트
- JSZip — ZIP 파일 생성
- FileSaver.js — 브라우저 다운로드 트리거
- IndexedDB — 이미지 캐싱
- Canvas API / OffscreenCanvas — 이미지 분할 및 배경 제거

## 라이선스

**Apache License 2.0 + Commons Clause**

소스 코드의 사용, 수정, 재배포는 자유롭지만 소프트웨어를 판매하는 것은 금지됩니다.
교육 및 연구 목적으로 자유롭게 사용할 수 있으며, 상업적 판매(호스팅, 컨설팅, SaaS 등 유료 서비스 포함)는 허용되지 않습니다.

자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

&copy; 2026 Hwang Minho (revfactory@gmail.com)
