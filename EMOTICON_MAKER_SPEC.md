<project_specification>

<project_name>Emoticon Maker - AI 이모티콘 생성 서비스</project_name>

<overview>
사진에서 카카오 이모티콘 24종 세트를 자동 생성하는 서버리스 웹 서비스. 사용자가 사진을 업로드(최대 3장)하면 AI가 다양한 스타일(지브리풍, 병맛, 미니멀, 실사화 등)을 제안하고, 선택한 스타일로 베이스 캐릭터를 생성한 후 24개 감정/상황 이모티콘을 자동 생성한다. 완성된 세트는 미리보기 페이지에서 확인하고 ZIP으로 다운로드할 수 있다.

사진의 대상은 사람뿐 아니라 고양이, 강아지 등 동물도 지원한다. AI가 자동으로 대상(subject)을 인식하여 동일 종(species)의 캐릭터를 생성한다.

모든 AI 기능은 Google Gemini API를 통해 브라우저에서 직접 호출한다. 별도 백엔드 서버 없이 GitHub Pages에서 정적 호스팅되며, 사용자의 Gemini API 키는 브라우저 세션에만 보관하고 서버로 전송하지 않는다. 생성된 이미지는 IndexedDB에 캐시하여 페이지 새로고침에도 유지된다.

CRITICAL: 백엔드 서버가 없다. 모든 API 호출은 브라우저에서 직접 수행한다. API 키는 sessionStorage에만 저장하고, 탭/브라우저 종료 시 자동 삭제된다. 이미지 데이터는 IndexedDB에 Blob으로 저장하며, localStorage는 사용하지 않는다 (용량 제한 5MB).
</overview>

<scope_boundaries>
  <in_scope>
    - Gemini API 키 입력 및 세션 관리
    - 사진 업로드 (드래그앤드롭 + 파일 선택, 최대 3장)
    - 사람 및 동물(고양이, 강아지 등) 사진 지원
    - AI 스타일 제안 (6종 프리셋 + AI 추천 스타일 + 직접 입력 탭)
    - 베이스 캐릭터 생성 및 재생성 (자동 재시도 포함)
    - AI 기반 24종 이모티콘 구성 동적 생성 + 인라인 편집
    - 24종 이모티콘 시트(3x2 그리드) 생성 + Canvas API 분할
    - 개별 이모티콘 360x360 PNG 투명배경 변환
    - 메인 이미지(240x240) 자동 생성
    - 이모티콘 미리보기 페이지 (그리드 + 모달 탐색)
    - 전체 세트 ZIP 다운로드
    - 시트 병렬 배치 생성 + 개별 시트 재생성
    - 생성 진행률 표시 (원형 프로그레스 + 시트 썸네일 스트립)
    - IndexedDB 기반 이미지 캐싱 + 새로고침 복원
    - 반응형 모바일 레이아웃
    - Google Analytics 이벤트 추적
  </in_scope>
  <out_of_scope>
    - 사용자 계정/로그인 시스템
    - 서버 측 API 프록시
    - 이모티콘 편집 (크롭, 회전, 필터)
    - GIF 움직이는 이모티콘
    - 카카오 이모티콘 스토어 직접 제출
    - 결제/구독 시스템
    - 다국어 지원 (한국어 단일)
    - 이모티콘 공유/소셜 기능
    - PWA 오프라인 모드
    - 탭 이미지(96x74) 생성
  </out_of_scope>
  <future_considerations>
    - GIF 움직이는 이모티콘 생성 (Phase 2)
    - 이모티콘 개별 재생성/교체 (Phase 2)
    - 라인/카카오 규격 선택 (Phase 2)
    - 탭 이미지(96x74) 자동 생성 (Phase 2)
    - 히스토리 관리 — 이전 생성 세트 목록 (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <frontend_application>
    <framework>Vanilla JavaScript (ES2022+) — 빌드 도구 없이 HTML + CSS + JS 3개 파일로 구성. GitHub Pages 직접 배포.</framework>
    <styling>Tailwind CSS (CDN script 모드, 커스텀 config 인라인) + 외부 style.css + Pretendard 폰트 (CDN)</styling>
    <state_management>일반 객체 리터럴(const state = {...})로 상태 관리. UI 업데이트는 DOM 직접 조작.</state_management>
    <note>CRITICAL: 빌드 단계 없음. index.html + style.css + app.js 3개 파일로 구성. GitHub Pages에 그대로 배포.</note>
  </frontend_application>
  <data_layer>
    <cache>IndexedDB (idb-keyval 패턴으로 직접 구현) — 생성된 이미지 Blob 저장</cache>
    <session>sessionStorage — API 키 저장</session>
    <note>localStorage는 사용하지 않는다 (5MB 제한으로 이미지 저장 불가). IndexedDB는 수백MB 가용.</note>
  </data_layer>
  <ai_integration>
    <sdk>Google Gen AI SDK (@google/genai) — esm.sh CDN에서 동적 import로 로드. 브라우저에서 직접 Gemini API 호출.</sdk>
    <model_image>gemini-3.1-flash-image-preview — 이미지 생성 (베이스 캐릭터, 이모티콘 시트)</model_image>
    <model_text>gemini-3.1-pro-preview — 텍스트 전용 (AI 스타일 추천, 이모티콘 구성 생성)</model_text>
    <note>멀티턴 채팅 미사용. 각 호출은 독립적인 generateContent. response_modalities: ['TEXT', 'IMAGE'].</note>
  </ai_integration>
  <libraries>
    <genai>@google/genai (esm.sh CDN, ESM 동적 import) — Gemini API 클라이언트</genai>
    <tailwind>Tailwind CSS (cdn.tailwindcss.com, script 모드) — 유틸리티 CSS 프레임워크</tailwind>
    <pretendard>Pretendard Variable (cdn.jsdelivr.net) — 한글 웹 폰트</pretendard>
    <jszip>JSZip v3.10.1 (cdnjs CDN) — ZIP 파일 생성</jszip>
    <filesaver>FileSaver.js v2.0.5 (cdnjs CDN) — 브라우저 다운로드 트리거</filesaver>
  </libraries>
  <build_output>
    <build_command>없음 — 정적 파일 직접 배포</build_command>
    <note>index.html + style.css + app.js로 구성. CDN 의존성은 동적 import와 script 태그로 관리.</note>
  </build_output>
</technology_stack>

<prerequisites>
  <environment_setup>
    - 모던 브라우저 (Chrome 90+, Safari 15+, Firefox 90+)
    - OffscreenCanvas API 지원 (시트 분할용)
    - IndexedDB 지원 (모든 모던 브라우저)
    - Google Gemini API 키 (사용자 각자 발급)
  </environment_setup>
</prerequisites>

<environment_variables>
  <variable>
    <name>GEMINI_API_KEY</name>
    <description>사용자가 런타임에 입력하는 Google Gemini API 키. 코드에 하드코딩하지 않음.</description>
    <required>true</required>
    <note>sessionStorage에만 보관. 서버 전송 없음. 탭 종료 시 삭제.</note>
  </variable>
</environment_variables>

<file_structure>
/                                   # GitHub Pages 루트
├── index.html                     # HTML 구조 + Tailwind 설정 + 메타 태그 (~250줄)
├── style.css                      # 커스텀 CSS 스타일 (~272줄)
├── app.js                         # 전체 앱 로직 (~1499줄)
├── README.md                      # 프로젝트 설명
└── LICENSE                        # Apache 2.0 + Commons Clause 라이선스
</file_structure>

<core_data_entities>
  <session_state>
    - apiKey: string (sessionStorage, 암호화 없음 — 세션 한정)
    - ai: GoogleGenAI 인스턴스
    - currentStep: enum (api_key, upload, style, base_review, emoticon_list, generating, complete)
    - uploadedPhotos: Array of { file: Blob, url: string, base64: string, mime: string } (최대 3장)
    - selectedStyle: object { id: string, name: string, prompt: string, isRealistic?: boolean }
    - customPrompt: string (사용자 직접 입력 프롬프트)
    - baseCharacter: Blob (생성된 베이스 캐릭터 이미지)
    - baseCharacterUrl: string (Object URL)
    - baseCharacterBase64: string (base64 인코딩 — 시트 생성 시 참조 이미지로 사용)
    - characterName: string (사용자 입력, 기본값 "My Character")
    - emoticonDefinitions: Array of { label: string, prompt: string } (24개 목록)
    - sheets: Blob[] (4장의 시트 이미지)
    - emoticons: Array of { index: number, blob: Blob, label: string } (24개)
    - mainImage: Blob (240x240)
    - failedSheets: number[] (실패한 시트 인덱스 목록)
    - setId: string (timestamp 기반)
  </session_state>

  <style_preset>
    - id: string (byungmat, ghibli, minimal, cute3d, anime, realistic, ai_*, custom)
    - name: string (표시명, 예: "지브리풍")
    - emoji: string (대표 이모지)
    - description: string (1줄 설명)
    - prompt: string (Gemini 프롬프트 템플릿)
    - isRealistic?: boolean (실사화 스타일 전용 플래그)
    - aiGenerated?: boolean (AI 추천 스타일 여부)
  </style_preset>

  <emoticon_definition>
    - label: string (한글 레이블, 예: "안녕!")
    - prompt: string (영문 Gemini 프롬프트)
  </emoticon_definition>

  <indexeddb_schema>
    - 데이터베이스: 'emoticon-maker', 오브젝트 스토어: 'images' (key-value)
    - uploadedPhoto_0 ~ uploadedPhoto_2: 업로드 사진 Blob (최대 3장)
    - baseCharacter: 베이스 캐릭터 Blob
    - sheet_0 ~ sheet_3: 시트 이미지 Blob (4장)
    - emoticon_0 ~ emoticon_23: 개별 이모티콘 Blob (24개)
    - mainImage: 메인 이미지 Blob (240x240)
  </indexeddb_schema>
</core_data_entities>

<authentication>
  CRITICAL: 인증 시스템 없음. API 키만 세션 단위로 관리.

  - 첫 접속 시 API 키 입력 화면 표시
  - 키 유효성 검증: Gemini API 모델 목록 조회(GET /v1beta/models?key=...)로 확인 (generateContent보다 빠름)
  - 유효하면 sessionStorage에 저장, GoogleGenAI 인스턴스 생성, 다음 단계로 이동
  - 무효하면 인라인 에러 메시지 + 재입력 유도
  - 탭 종료 시 자동 삭제 (sessionStorage 특성)
  - 페이지 새로고침 시 sessionStorage에서 키 복원하여 자동 로그인
  - "키 변경" 버튼으로 언제든 재입력 가능 (헤더에 키 마스킹 표시)
</authentication>

<route_definitions>
  CRITICAL: SPA가 아닌 단일 페이지. URL 라우팅 없음. 스텝 기반 위자드 UI.

  전체 흐름은 하나의 index.html 내에서 단계별 화면 전환으로 구현:
  Step 1: API 키 입력
  Step 2: 사진 업로드 (최대 3장)
  Step 3: 스타일 선택
  Step 4: 베이스 캐릭터 확인
  Step 5: 이모티콘 구성 확인 (AI 생성 24개 목록 + 인라인 편집)
  Step 6: 이모티콘 생성 (진행률 + 시트 병렬 배치 생성)
  Step 7: 완성 미리보기 + 다운로드
</route_definitions>

<component_hierarchy>
  <app>
    <header>                          <!-- 로고 + 키 상태/변경 버튼 (sticky top) -->
      <logo />                        <!-- "Emoticon Maker" 텍스트 로고, 클릭 시 처음으로 -->
      <key_status />                  <!-- 마스킹된 키 표시 + 변경 버튼 -->
    </header>

    <step_indicator />                <!-- 7개 원형 스텝, 완료 단계 클릭 가능, CSS 툴팁 -->

    <main>                            <!-- 스텝별 화면 전환 영역 -->
      <!-- Step 1 -->
      <api_key_screen>
        <key_input />                 <!-- API 키 입력 필드 + 안내 텍스트 + 발급 링크 -->
        <validate_button />
      </api_key_screen>

      <!-- Step 2 -->
      <upload_screen>
        <drop_zone />                 <!-- 드래그앤드롭 + 파일 선택, 사진 있으면 compact 모드 -->
        <photo_grid />                <!-- 업로드된 사진 그리드 (최대 3장, 개별 삭제 버튼) -->
        <upload_actions />            <!-- "처음부터 다시" + "다음 단계 →" -->
      </upload_screen>

      <!-- Step 3 -->
      <style_screen>
        <photo_thumbnails />          <!-- 업로드한 사진 썸네일 (원형, 다중) -->
        <style_tabs>                  <!-- "추천 스타일" / "직접 입력" 2개 탭 -->
          <recommended_tab>
            <style_grid />            <!-- 6개 프리셋 + AI 추천 카드들 + AI 추천 더 받기 -->
          </recommended_tab>
          <custom_tab>
            <custom_prompt_input />   <!-- 텍스트 영역 독립 표시 -->
          </custom_tab>
        </style_tabs>
        <generate_base_button />
      </style_screen>

      <!-- Step 4 -->
      <base_review_screen>
        <base_image_display />        <!-- 생성된 베이스 캐릭터 크게 표시 + 스켈레톤 로딩 -->
        <character_name_input />      <!-- 캐릭터 이름 입력 -->
        <action_buttons>              <!-- 확정 / 다시 만들기 / 스타일 변경 -->
          <confirm_button />
          <regenerate_button />
          <change_style_button />
        </action_buttons>
      </base_review_screen>

      <!-- Step 5 -->
      <emoticon_list_screen>
        <list_header />               <!-- "이모티콘 구성을 확인하세요" -->
        <list_skeleton />             <!-- 로딩 중 스켈레톤 24개 -->
        <emoticon_list_grid />        <!-- 2열 그리드, 24개 항목 + ✏️ 인라인 편집 -->
        <action_buttons>
          <back_to_base_button />     <!-- "← 캐릭터 다시 보기" -->
          <confirm_list_button />     <!-- "이대로 만들기 →" -->
        </action_buttons>
      </emoticon_list_screen>

      <!-- Step 6 -->
      <generating_screen>
        <progress_ring />             <!-- 원형 SVG 프로그레스 (0/4 시트) -->
        <progress_detail />           <!-- "시트 1~2 생성 중..." -->
        <sheet_preview_strip />       <!-- 시트 썸네일 4개, 클릭 시 모달로 확대 -->
        <generating_nav />            <!-- 생성 완료 후: "← 구성 수정" / "완성 보기 →" -->
        <retry_sheet_button />        <!-- 실패 시트 재시도 버튼 -->
      </generating_screen>

      <!-- Step 7 -->
      <complete_screen>
        <character_header />          <!-- 캐릭터 이름 + 베이스 이미지 (원형 아바타) -->
        <special_images />            <!-- 메인 이미지 (240x240) -->
        <emoticon_grid />             <!-- 4열 그리드 24개 이모티콘 (모바일 3열) -->
        <download_section>
          <download_zip_button />     <!-- 전체 ZIP 다운로드 -->
          <new_set_button />          <!-- 새 이모티콘 만들기 -->
        </download_section>
      </complete_screen>
    </main>

    <footer>                          <!-- "© 2026 Hwang Minho" -->
  </app>

  <shared>
    <loading_overlay />               <!-- 반투명 오버레이 + 스피너 -->
    <toast_container />               <!-- 성공/에러/정보 알림 (최대 2개 스택) -->
    <modal_overlay />                 <!-- 이모티콘/시트 확대 모달 (이전/다음 + 키보드) -->
  </shared>
</component_hierarchy>

<pages_and_interfaces>
  <global_layout>
    - 최대 너비: 720px, 중앙 정렬, 좌우 padding 24px (모바일 16px)
    - 배경: #FAFAFA
    - 헤더: 높이 64px, sticky top, 하단 border 1px solid #E5E5E5, z-index 100
    - 모든 카드: border-radius 16px, background #FFFFFF, box-shadow 0 1px 3px rgba(0,0,0,0.06)
  </global_layout>

  <step_indicator>
    - 7개 원형 스텝 (각 28px), 선으로 연결
    - 완료: 배경 #111111, 텍스트 #FFFFFF
    - 현재: 배경 #111111, 텍스트 #FFFFFF, scale(1.1), ring 2px #111111 offset 3px
    - 미완료: 배경 #E5E5E5, 텍스트 #999999
    - 연결선: 완료 #111111 2px solid, 미완료 #E5E5E5 2px solid
    - CSS 커스텀 툴팁: data-tooltip 속성 + CSS ::after 가상 요소로 호버 시 표시
      - 레이블: API 키, 사진 업로드, 스타일 선택, 캐릭터 확인, 구성 확인, 생성 중, 완성
    - 완료된 단계 클릭 시 해당 단계로 이동 (generating 단계 제외)
    - 모바일: 아이콘만 표시 (숫자 숨김), gap 축소
  </step_indicator>

  <step1_api_key>
    - 중앙 정렬 카드, padding 48px 32px
    - 타이틀: "Gemini API 키를 입력하세요" (24px, #111111, font-weight 700)
    - 설명: "키는 브라우저에만 임시 저장되며 서버로 전송되지 않습니다" (14px, #888888)
    - API 키 발급 링크: "Google AI Studio에서 발급받기 →" (14px, #111111, underline)
    - 입력 필드: type=password, 전체 너비, height 48px, border-radius 12px, border 1.5px solid #E0E0E0
      - focus: border-color #111111, box-shadow 0 0 0 3px rgba(0,0,0,0.05)
      - 우측 토글: 👁 아이콘으로 키 표시/숨기기
      - Enter 키로 제출 가능
    - 확인 버튼: 전체 너비, height 48px, background #111111, color #FFFFFF, border-radius 12px, font-weight 600
      - hover: background #333333
      - loading: 스피너 아이콘 + "확인 중..."
    - 에러 상태: 입력 필드 border-color #EF4444, 하단에 에러 메시지 (13px, #EF4444)
    - 성공: 녹색 체크 아이콘 + "키가 확인되었습니다" → 0.5초 후 자동 전환
    - 키 검증 방식: GET /v1beta/models?key={key} (모델 목록 조회, generateContent보다 빠름)
  </step1_api_key>

  <step2_upload>
    - 드롭존: 점선 border 2px dashed #D0D0D0, border-radius 20px, 높이 320px
      - 중앙: 카메라 아이콘 (48px, #CCCCCC) + "사진을 드래그하거나 클릭하세요" (16px, #888888)
      - 하단: "JPG, PNG, WebP / 최대 10MB / 최대 3장" (13px, #BBBBBB)
      - hover: border-color #111111, background rgba(0,0,0,0.02)
      - 드래그 오버: border-color #111111, background rgba(0,0,0,0.04), 'dragover' 클래스
      - 사진 있으면 compact 모드 (높이 축소), MAX 도달 시 hidden
    - 사진 그리드: 업로드된 사진들을 그리드로 표시 (최대 3장)
      - 각 사진: 미리보기 이미지 + × 삭제 버튼
      - 개별 삭제 가능
    - 하단 버튼 2개: "처음부터 다시" (ghost) + "다음 단계 →" (primary)
    - 파일 검증:
      - 허용 형식: image/jpeg, image/png, image/webp
      - 최대 크기: 10MB
      - 최대 장수: 3장 (초과 시 info 토스트)
      - 실패 시 토스트 에러 메시지
    - 각 사진은 IndexedDB에 즉시 저장 (uploadedPhoto_0 ~ uploadedPhoto_2)
  </step2_upload>

  <step3_style>
    - 상단: 업로드한 사진 썸네일들 (원형, 다중 표시)
    - 타이틀: "어떤 스타일로 만들까요?" (22px, #111111)
    - 탭 UI: "추천 스타일" / "직접 입력" 2개 탭으로 분리
      - 탭 전환 시 해당 콘텐츠 영역만 표시/숨김

    [추천 스타일 탭]
    - 스타일 그리드: 2열, gap 12px
      - 각 카드: padding 20px, border-radius 16px, border 2px solid transparent, cursor pointer
        - 좌측: 이모지 아이콘 (32px)
        - 우측: 스타일 이름 (15px, 700) + 설명 (13px, #888888)
        - hover: border-color #E0E0E0, translateY(-2px), shadow 증가
        - 선택됨: border-color #111111, background #EBEBEB, !important로 우선순위 강화
      - 프리셋 6종:
        1. 🎨 병맛 스케치 — "대충 그린 듯한 뀨여운 병맛 캐릭터"
        2. 🌸 지브리풍 — "미야자키 스타일 수채화 감성"
        3. ✏️ 미니멀 라인 — "심플한 선화, 최소 디테일"
        4. 🧸 귀여운 3D — "쫀득쫀득 마시멜로 3D 캐릭터"
        5. 🎌 애니메이션 — "일본 애니메이션 스타일 SD 캐릭터"
        6. 📸 실사화 — "실제 사진처럼 리얼한 캐릭터" (isRealistic: true, 특별 프롬프트 분기)
      - AI 추천 카드: "✨ AI 테마 추천 더 받기" 점선 카드 (그리드 마지막 위치)
        - 점선 border, 클릭 시 Gemini(gemini-3.1-pro-preview)로 3개 새 스타일 동적 생성
        - 누적 추가 가능 (기존 추천 유지하고 새로 추가)
        - 로딩 중 스피너 표시 + pointer-events 비활성화
        - 자동 추천 없음 — 사용자가 버튼 클릭 시에만 AI 추천 생성

    [직접 입력 탭]
    - 텍스트 영역만 독립 표시
      - placeholder: "원하는 스타일을 설명해주세요 (예: 피카소 큐비즘 스타일, 파스텔 톤)"
      - height 120px, border-radius 12px, resize: vertical

    - "← 사진 변경" 버튼 (ghost)
    - 하단 버튼: "캐릭터 만들기 →" (primary, disabled until style selected or custom prompt entered)
  </step3_style>

  <step4_base_review>
    - 베이스 캐릭터 이미지: 중앙, max-width 360px, border-radius 20px, shadow
      - 로딩 중: 스켈레톤 pulse 애니메이션 (360x360), display: flex
        - 중앙 텍스트: "캐릭터 생성중..." + 점 애니메이션 (...)
    - 캐릭터 이름 입력: 하단, 중앙 정렬
      - placeholder: "캐릭터 이름 (선택)"
      - width 240px, height 44px, text-align center, border-radius 12px
      - 기본값: "My Character"
    - 액션 버튼 3개 (수평 배치, gap 8px):
      - "이 캐릭터로 진행 →" (primary, 가장 넓음)
      - "🔄 다시 만들기" (secondary/ghost)
      - "← 스타일 변경" (ghost, 작은 텍스트)
    - "다시 만들기" 클릭 시:
      - 같은 스타일로 재생성 (동일 프롬프트, Gemini의 랜덤성으로 다른 결과)
      - 스켈레톤 표시 → 새 이미지로 전환
    - 생성 실패 시 자동 재시도 (최대 2회), 모두 실패 시 에러 토스트 + 스타일 단계로 복귀
  </step4_base_review>

  <step5_emoticon_list>
    - 타이틀: "이모티콘 구성을 확인하세요" (22px, #111111, 700)
    - 설명: "AI가 제안한 24가지 감정/상황입니다." (14px, #888888)
    - 로딩 상태: 스켈레톤 그리드 (24개 줄, pulse 애니메이션)
    - 목록 그리드: 2열, gap 8px
      - 각 항목: padding 12px 16px, border-radius 12px, background #FFFFFF, border 1px solid #F0F0F0
        - 좌측: 번호 (13px, #CCCCCC, 고정 24px 너비, 01~24 형식)
        - 중앙: 한글 레이블 (14px, #111111, 600)
        - 하단: 영문 설명 (12px, #AAAAAA, 1줄 ellipsis)
        - 우측: ✏️ 연필 아이콘 (인라인 편집 트리거)
      - hover: background #F9F9F9
      - 인라인 편집 모드 (✏️ 클릭 시):
        - label(한글) input + prompt(영문) textarea로 전환
        - "저장" / "취소" 버튼
        - 한 번에 하나의 항목만 편집 가능 (다른 편집 자동 닫힘)
        - 저장 시 state.emoticonDefinitions에 직접 반영
    - 액션 버튼:
      - "← 캐릭터 다시 보기" (ghost)
      - "이대로 만들기 →" (primary, 전체 너비, height 48px)
    - 모바일: 1열 레이아웃
  </step5_emoticon_list>

  <step6_generating>
    - 원형 SVG 프로그레스: 중앙, 160px, stroke 6px
      - 배경 원: #E5E5E5
      - 진행 원(fg-circle): #111111, stroke-dasharray 애니메이션 + 2초 주기 opacity 펄스
      - 중앙 텍스트: "2/4" (32px, 700) + scale 브리딩 애니메이션
      - 하단 텍스트: "시트 1~2 생성 중..." (14px, #888888) + ::after 점 애니메이션 (...)
    - 완성된 시트 미리보기: 가로 스트립
      - 각 시트 썸네일: 4개, 클릭 가능 (모달로 확대)
      - 완성: done 클래스 + 이미지 표시
      - 미완성: 번호 텍스트 + 점선 border
      - 에러: ! 텍스트 + sheet-error 클래스
      - 각 시트별 ↻ 재생성 버튼
    - 예상 시간: "약 1~2분 소요" (13px, #BBBBBB)
    - 취소 버튼 없음 (API 호출 취소 불가)
    - 실패 시: "실패한 시트 재시도" 버튼 표시
    - 생성 완료 후: 네비게이션 버튼 영역 표시
      - "← 구성 수정" (ghost) — 이모티콘 구성 화면으로 복귀
      - "완성 보기 →" (primary) — 완성 화면으로 이동
    - 시트 모달: 시트 썸네일 클릭 시 원본 크기로 확대, 이전/다음 시트 탐색
      - 모달 내 "이 시트 재생성" 버튼
  </step6_generating>

  <step7_complete>
    - 헤더 영역: 캐릭터 이름 (28px, 700) + 베이스 이미지 (80x80, 원형)
    - 스페셜 이미지 섹션:
      - 메인 이미지 (240x240)
      - 라벨: "메인 240×240" (12px, #AAAAAA)
    - 이모티콘 그리드: 4열, gap 12px
      - 각 카드: aspect-ratio 1, background #FFFFFF, border-radius 16px, shadow
      - 이미지: 80% 크기, object-fit contain
      - 넘버링: 좌상단 10px, #CCCCCC
      - 레이블: 하단 10px, #999999, 1줄 ellipsis
      - hover: translateY(-4px), shadow 증가
      - 클릭: 모달 열기
    - 모달:
      - 배경: rgba(0,0,0,0.6), backdrop-filter blur(4px)
      - 콘텐츠: max-width 320px, border-radius 24px, padding 24px
      - 이미지: 240x240
      - 레이블 + 번호 (예: "3 / 24")
      - 이전/다음 버튼: 노란색(#FFE812) 배경, border-radius 12px
        - flex 기반 배치 (position: static, gap: 16px)
        - 모바일: position: fixed, bottom: 16px
      - 키보드: ←→ 탐색, ESC 닫기
      - 배경 클릭으로 닫기
    - 다운로드 섹션:
      - ZIP 다운로드 버튼: 전체 너비, height 56px, background #111111, color #FFFFFF
        - 아이콘: 📦 + "전체 다운로드 (ZIP)"
        - 다운로드 중: "압축 중..." 텍스트
        - 파일명: "{캐릭터이름}_emoticons.zip" (특수문자 언더스코어 치환)
      - "새 이모티콘 만들기" 링크 버튼 (하단, ghost)
    - 모바일: 3열 그리드
  </step7_complete>
</pages_and_interfaces>

<core_functionality>
  <gemini_api_integration>
    - @google/genai SDK를 esm.sh CDN에서 동적 import로 로드
    - GoogleGenAI 클라이언트를 사용자 입력 API 키로 초기화: new GoogleGenAI({ apiKey })
    - 키 검증: GET /v1beta/models?key={key} (모델 목록 조회)
    - 이미지 생성: models.generateContent({ model, contents, config }) + responseModalities ['TEXT', 'IMAGE']
    - 이미지 응답 처리: response.candidates[0].content.parts에서 inlineData.data (base64) → Blob 변환
    - 에러 핸들링: callGeminiWithRetry 래퍼로 429(레이트 리밋) → 5초 대기 후 재시도 (최대 3회)
    - 기타 에러: 400(안전 필터) → 필터 차단 안내, 500(서버 오류) → 서버 오류 안내, 네트워크 에러 → 인터넷 확인 안내
  </gemini_api_integration>

  <base_character_generation>
    - 사용자 사진(최대 3장) + 선택된 스타일 프롬프트를 조합
    - Gemini에 사진을 인라인 데이터로 전달: parts에 [text prompt, ...inlineData photos]
    - 프롬프트 핵심: subject 자동 인식 (사람/고양이/강아지 등), 동일 종 유지, 고유 특징 보존
    - 실사화(isRealistic) 스타일: 별도 프롬프트 분기 (사진 리얼리즘, 틸트시프트, 약간 큰 머리)
    - 모델: gemini-3.1-flash-image-preview
    - 생성 설정: responseModalities ['TEXT', 'IMAGE'] (별도 imageConfig 없음 — 1:1 비율은 프롬프트로 지시)
    - 자동 재시도: 최대 2회 시도, 1차 실패 시 2초 대기 후 재시도
    - 전부 실패 시 에러 토스트 + 스타일 선택 단계로 복귀
    - 결과를 IndexedDB에 저장 (baseCharacter)
    - "다시 만들기" 시 동일 프롬프트로 재호출 (Gemini의 랜덤성으로 다른 결과)
  </base_character_generation>

  <emoticon_definitions_generation>
    CRITICAL: 24개 감정/상황 목록은 하드코딩하지 않는다. 매번 Gemini가 새로운 세트를 동적으로 생성한다.

    생성 흐름:
    1. 베이스 캐릭터 확정 후, Gemini(gemini-3.1-pro-preview)에 베이스 캐릭터 이미지와 함께 요청
    2. 프롬프트로 캐릭터의 비주얼 스타일/성격을 분석하고 24개 시나리오 설계 요청
    3. Gemini 응답을 JSON 파싱하여 24개 정의 목록을 얻는다

    생성 가이드라인 (Gemini 프롬프트에 포함):
    - 필수 감정 (8개): 인사/안녕, 고마워, 사랑, 울음/슬픔, 화남, 놀람, 대폭소, 좋아요/엄지척
    - 일상 상황 (8개): 출근, 퇴근, 식사, 커피, 잠, 운동, 폰 확인, 돈 없음
    - 소통 표현 (8개): 미안, 축하, 파이팅, 싫어/거절, 비밀/쉿, 기다려, 신남, 바이바이
    - 첫 번째는 인사, 마지막은 바이바이
    - 각 prompt는 역동적이고 과장된 포즈/액션, 구체적 소품/효과 포함
    - JSON 배열로 반환: [{ "label": "한글 2-5자", "prompt": "영문 상세 설명" }]

    파싱 실패 시 폴백: FALLBACK_DEFINITIONS (하드코딩된 24개 기본 목록) 사용

    UI (Step 5):
    - 스켈레톤 로딩 → 2열 그리드로 24개 목록 표시
    - 각 항목: 번호 + 한글 레이블 + 영문 설명 + ✏️ 편집 버튼
    - 인라인 편집: label(한글) + prompt(영문) 직접 수정 가능
    - "이대로 만들기 →" 버튼: 확정 후 시트 생성 시작

    폴백 예시 목록 (Gemini 실패 시):
    1. 안녕! — jumping up energetically with both arms stretched wide open
    2. 고마워 — holding a glowing golden star gift forward with both hands
    3. 사랑해 — spinning around with giant pink heart above head
    4. 대박 웃김 — literally rolling on the floor, slapping the ground
    5. 분노폭발 — tiny body with massively inflated red head, volcanic eruption
    6. 깜짝! — launched backward into the air from shock
    7. 흑흑 — sitting in a puddle of own tears that keeps growing
    8. 최고! — standing on top of a mountain triumphantly
    9. 미안해 — shrunk to tiny size, hiding behind a huge "sorry" sign
    10. 축하해 — popping champagne bottle with confetti explosion
    11. 피곤... — melting into the floor like liquid, soul floating out
    12. 싫어 — building a brick wall, peeking over top with disgusted expression
    13. 출근길 — zombie-walking with briefcase dragging on ground
    14. 퇴근! — rocket-launching from office chair into the sky
    15. 밥 먹자 — aggressively chopsticking a mountain of food
    16. 커피 충전 — plugging coffee cup into self like charging a battery
    17. 잠 온다 — head slowly falling forward then snapping back up
    18. 운동 중 — struggling to lift a barbell that is bending
    19. 읽씹 금지 — staring intensely at phone screen, tapping frantically
    20. 쉿 비밀 — wearing detective hat and trench coat
    21. 돈 없음 — turning wallet upside down with moths flying out
    22. 기다려 — sitting cross-legged checking wristwatch impatiently
    23. 파이팅! — power-up pose with aura flames blazing around body
    24. 바이바이 — riding away on a rainbow while waving with both hands
  </emoticon_definitions_generation>

  <emoticon_set_generation>
    - 24개 이모티콘을 4장의 시트(각 6개, 3x2 그리드)로 생성
    - 각 시트마다 Gemini API 호출 (베이스 캐릭터를 참조 이미지로 포함)
    - 시트 프롬프트 핵심:
      - 캐릭터 아이덴티티 정확 매칭 (종, 얼굴, 체형, 색상, 의상, 액세서리)
      - 레이아웃: 3x2 그리드, 순백 배경, 그리드 라인 없음
      - 6개 포즈/표정 (이모티콘 정의에서 가져옴)
      - 강화 지시문: "EXACTLY 6 characters", "NO TEXT anywhere"
      - 실사화 스타일: "render" 용어 사용, 비실사: "draw/illustrations" 사용
    - 시트 imageConfig: { aspectRatio: '3:2', imageSize: '2K' }
    - 모델: gemini-3.1-flash-image-preview

    병렬 배치 생성:
    - 배치 1: 시트 0, 1 동시 생성 (Promise.allSettled)
    - 2초 대기 (rate limit 보호)
    - 배치 2: 시트 2, 3 동시 생성 (Promise.allSettled)
    - 각 시트 완성 시 즉시 분할 + IndexedDB 저장 + 미리보기 업데이트

    시트별 개별 재생성:
    - 시트 썸네일 옆 ↻ 재생성 버튼
    - 시트 모달에서 "이 시트 재생성" 버튼
    - 개별 시트만 재생성 후 기존 결과에 교체
  </emoticon_set_generation>

  <sheet_splitting>
    - OffscreenCanvas로 시트를 6등분 (3열 x 2행 균등 분할)
    - 각 셀에 소량 마진 적용: margin = max(3px, 셀 너비의 1%) — 그리드 라인 아티팩트 방지
    - 흰색 배경으로 초기화 후 셀 내용 draw
    - 흰색 배경 → 투명 변환: removeWhiteBackground
    - OffscreenCanvas 360x360 → convertToBlob('image/png')
    - 메인 이미지: 01번 이모티콘을 OffscreenCanvas 240x240으로 리사이즈
    - 분할 결과에 label 포함 (emoticonDefinitions에서 가져옴)
  </sheet_splitting>

  <white_to_transparent>
    - Canvas API getImageData로 픽셀 데이터 접근
    - R, G, B 모두 235 이상인 픽셀: Alpha를 0으로 설정 (완전 투명)
    - R, G, B 모두 215~234 범위: 점진적 Alpha 감소 (edge smoothing/안티앨리어싱)
      - alpha = 255 * (1 - (whiteness - 215) / 40)
      - 기존 alpha와 비교하여 더 작은 값 적용
    - putImageData로 결과 적용
  </white_to_transparent>

  <zip_download>
    - JSZip으로 ZIP 파일 구성:
      - main.png (240x240)
      - 01.png ~ 24.png (360x360, 투명 배경)
      - 총 25개 파일
    - FileSaver.js의 saveAs로 다운로드 트리거
    - 파일명: "{캐릭터이름}_emoticons.zip" (특수문자 → 언더스코어 치환)
    - 압축 중 버튼 텍스트 "압축 중..." 표시 + disabled
  </zip_download>

  <image_caching>
    - IndexedDB에 'emoticon-maker' 데이터베이스 생성 (version 1)
    - 'images' 오브젝트 스토어: key=string, value=Blob
    - 저장 항목: 업로드 사진(최대 3장), 베이스 캐릭터, 시트 4장, 이모티콘 24개, 메인 이미지
    - 각 생성 단계마다 즉시 IndexedDB에 저장 (중간 크래시 대비)
    - 페이지 새로고침 시 tryRestore로 IndexedDB에서 복원:
      - mainImage + 24개 이모티콘 모두 존재해야 복원 성공
      - 복원 시 FALLBACK_DEFINITIONS를 label로 사용 (원본 AI 생성 label은 복원 불가)
      - 복원 성공 시 바로 완성 화면(Step 7)으로 이동
    - "새 이모티콘 만들기" 시:
      - dbClear()로 IndexedDB 전체 삭제
      - 모든 state 초기화
      - fileInput.value 리셋
      - aiSuggestedStyles 초기화
      - 탭 상태 초기화 (추천 스타일 탭으로)
      - 업로드 단계로 이동
  </image_caching>

  <analytics>
    - Google Analytics (G-JTHB7X8VGR) 내장
    - gtag.js 비동기 로드 (index.html head)
    - trackEvent 함수로 이벤트 전송:
      - step_view: 각 단계 진입 시 (step_name, step_index)
      - 기타 사용자 인터랙션 추적
  </analytics>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>
      - 성공(success): background #111111, color #FFFFFF, 3초 자동 닫힘
      - 에러(error): background #EF4444, color #FFFFFF, 수동 닫힘 (× 버튼)
      - 정보(info): background #F5F5F5, color #333333, 3초 자동 닫힘
      - 위치: 상단 중앙 (fixed)
      - 최대 2개 스택 (초과 시 가장 오래된 것 제거)
      - 퇴장: exiting 클래스 + 150ms 후 제거
    </toast_notifications>
    <inline_errors>
      - API 키 무효: "유효하지 않은 API 키입니다. 다시 확인해주세요."
      - 파일 형식 오류: "JPG, PNG, WebP 파일만 업로드할 수 있습니다."
      - 파일 크기 초과: "파일 크기가 10MB를 초과합니다."
      - 사진 수 초과: "사진은 최대 3장까지 업로드할 수 있습니다."
      - 이미지 생성 실패: "AI가 이미지를 생성하지 못했습니다. 다른 사진이나 스타일을 시도해주세요."
      - 네트워크 오류: "인터넷 연결을 확인해주세요."
    </inline_errors>
  </user_facing>
  <api_errors>
    - 429 (레이트 리밋) / RESOURCE_EXHAUSTED: 자동 5초 대기 후 재시도 (최대 3회), "잠시 대기 중... (API 제한)" 토스트
    - 400 (안전 필터) / SAFETY: "이미지가 안전 필터에 의해 차단되었습니다. 다른 사진이나 스타일을 시도해주세요." 토스트
    - 500 (서버 오류): "Gemini 서버 오류입니다. 잠시 후 다시 시도해주세요." 토스트
    - 네트워크 오류: "인터넷 연결을 확인해주세요." 토스트
    - 시트 생성 부분 실패: 성공한 시트는 유지, 실패 시트만 sheet-error 표시 + "실패한 시트 재시도" 버튼
    - 베이스 캐릭터 생성 실패: 자동 재시도 (최대 2회), 모두 실패 시 스타일 단계로 복귀
  </api_errors>
  <recovery>
    - 페이지 새로고침: IndexedDB에서 완성된 세트 복원 (API 키 + 전체 이모티콘 존재 시)
    - IndexedDB 실패: graceful degradation (콘솔 경고만)
    - "새 이모티콘 만들기" 시 모든 상태 + IndexedDB 초기화
  </recovery>
</error_handling>

<third_party_integrations>
  <integration name="Google Gemini API">
    <purpose>이미지 생성 (텍스트→이미지), 텍스트 생성 (AI 스타일 추천, 이모티콘 구성 생성)</purpose>
    <sdk>@google/genai via ESM CDN (esm.sh/@google/genai), 동적 import</sdk>
    <models>
      - gemini-3.1-flash-image-preview: 이미지 생성 (베이스 캐릭터, 이모티콘 시트)
      - gemini-3.1-pro-preview: 텍스트 전용 (AI 스타일 추천, 이모티콘 구성 생성)
    </models>
    <api_pattern>
      - 클라이언트 생성: new GoogleGenAI({ apiKey })
      - 이미지 생성: ai.models.generateContent({ model, contents, config })
      - 이미지 입력: { inlineData: { mimeType, data: base64 } }
      - 이미지 출력: response.candidates[0].content.parts → inlineData.data (base64)
      - 멀티턴 채팅 미사용 — 모든 호출이 독립적 generateContent
    </api_pattern>
    <rate_limits>
      - 무료 티어: 분당 15 요청
      - 시트 배치 간 2초 딜레이로 자체 조절
      - 429 발생 시 5초 대기 후 자동 재시도 (최대 3회)
    </rate_limits>
  </integration>

  <integration name="Tailwind CSS">
    <purpose>유틸리티 CSS 프레임워크</purpose>
    <sdk>Tailwind CSS CDN (cdn.tailwindcss.com, script 모드)</sdk>
    <usage>
      - index.html에서 인라인 tailwind.config로 커스텀 테마 설정
      - 커스텀 colors, fontFamily, borderRadius, boxShadow 정의
      - 추가 스타일은 style.css에서 일반 CSS로 작성
    </usage>
  </integration>

  <integration name="JSZip">
    <purpose>브라우저에서 ZIP 파일 생성</purpose>
    <sdk>JSZip v3.10.1 via cdnjs CDN</sdk>
    <usage>
      - const zip = new JSZip()
      - zip.file("main.png", blob)
      - zip.file("01.png", blob) ... zip.file("24.png", blob)
      - zip.generateAsync({ type: "blob" })
    </usage>
  </integration>

  <integration name="FileSaver.js">
    <purpose>브라우저 다운로드 트리거</purpose>
    <sdk>FileSaver.js v2.0.5 via cdnjs CDN</sdk>
    <usage>saveAs(blob, "{이름}_emoticons.zip")</usage>
  </integration>

  <integration name="Google Analytics">
    <purpose>사용자 행동 분석 및 이벤트 추적</purpose>
    <sdk>gtag.js (googletagmanager.com)</sdk>
    <tracking_id>G-JTHB7X8VGR</tracking_id>
    <usage>
      - 비동기 로드: index.html head에 script 태그
      - trackEvent(action, params) 함수로 이벤트 전송
      - 주요 이벤트: step_view (각 단계 진입)
    </usage>
  </integration>
</third_party_integrations>

<aesthetic_guidelines>
  <design_philosophy>
    모던 미니멀. 색상은 극도로 절제하여 흑백 + 단일 액센트. 둥근 모서리와 넉넉한 여백으로 친근하고 캐주얼한 느낌. 콘텐츠(이모티콘)가 주인공이고 UI는 배경에 머문다. Apple Human Interface Guidelines의 깔끔함 + 카카오의 따뜻함.
  </design_philosophy>

  <color_palette>
    <primary>
      - Black: #111111 — 주요 버튼, 텍스트, 액센트
      - White: #FFFFFF — 카드 배경, 버튼 텍스트
    </primary>
    <background>
      - Page: #FAFAFA — 전체 배경
      - Card: #FFFFFF — 카드/패널 배경
      - Subtle: #F5F5F5 — 선택된 카드, hover 배경
    </background>
    <text>
      - Primary: #111111 — 제목, 본문
      - Secondary: #888888 — 부제, 설명
      - Muted: #BBBBBB — 힌트, placeholder
    </text>
    <border>
      - Default: #E5E5E5 — 카드 border, 구분선
      - Active: #111111 — 선택/포커스 border
    </border>
    <status>
      - Error: #EF4444 — 에러 메시지, 실패 상태
      - Success: #22C55E — 성공 메시지 (키 확인 등)
    </status>
    <accent>
      - Kakao Yellow: #FFE812 — 모달 네비게이션 버튼 (이전/다음)에만 사용
    </accent>
  </color_palette>

  <typography>
    <font_families>
      - Primary: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
      - Mono: 'SF Mono', 'Fira Code', monospace (API 키 입력/마스킹에만 사용)
    </font_families>
    <font_sizes>
      - Hero: 28px / 700 — 완성 화면 캐릭터 이름
      - Title: 24px / 700 — 스텝 타이틀
      - Subtitle: 18px / 600 — 섹션 제목
      - Body: 15px / 400 — 본문
      - Caption: 13px / 400 — 설명, 힌트
      - Tiny: 11px / 500 — 넘버링, 라벨
    </font_sizes>
  </typography>

  <spacing>
    - Base unit: 4px
    - Scale: 4, 8, 12, 16, 20, 24, 32, 48, 64
    - 카드 내부 padding: 24px
    - 섹션 간 gap: 32px
    - 그리드 gap: 12px
  </spacing>

  <borders_and_shadows>
    <borders>
      - Default: 1px solid #E5E5E5
      - Active: 2px solid #111111
      - Dashed: 2px dashed #D0D0D0 (드롭존)
    </borders>
    <border_radius>
      - Small: 8px (뱃지, 작은 요소)
      - Medium: 12px (입력, 버튼)
      - Large: 16px (카드)
      - XLarge: 20px (이미지 컨테이너)
      - Full: 50% (아바타, 프로그레스 링)
    </border_radius>
    <shadows>
      - Card: 0 1px 3px rgba(0,0,0,0.06)
      - Hover: 0 8px 24px rgba(0,0,0,0.1)
      - Modal: 0 20px 60px rgba(0,0,0,0.2)
    </shadows>
  </borders_and_shadows>

  <component_styling>
    <buttons>
      - Primary: background #111111, color #FFFFFF, height 48px, border-radius 12px, font-weight 600
        - hover: background #333333
        - active: scale(0.98)
        - disabled: background #E5E5E5, color #AAAAAA, cursor not-allowed
      - Ghost: background transparent, color #111111, border 1.5px solid #E0E0E0
        - hover: background #F5F5F5
      - Danger: background #EF4444, color #FFFFFF
    </buttons>
    <inputs>
      - height 48px, padding 0 16px, border-radius 12px, border 1.5px solid #E0E0E0
      - focus: border-color #111111, outline none, box-shadow 0 0 0 3px rgba(0,0,0,0.05)
      - placeholder: color #CCCCCC
    </inputs>
    <cards>
      - background #FFFFFF, border-radius 16px, padding 24px, shadow Card
      - selectable: border 2px solid transparent → selected: border #111111, background #EBEBEB !important
    </cards>
  </component_styling>

  <animations>
    <micro_interactions>
      - 버튼 hover: 150ms ease-out
      - 카드 hover: translateY(-4px) 200ms ease-out
      - 토스트 입장: slideDown 200ms ease-out
      - 토스트 퇴장: exiting 클래스 + 150ms ease-in
    </micro_interactions>
    <page_transitions>
      - 스텝 전환: fadeIn 300ms ease-out (현재 스텝 active 클래스)
    </page_transitions>
    <loading_states>
      - 스켈레톤: pulse 1.5s ease-in-out infinite (#E5E5E5 → #F5F5F5)
      - 프로그레스 링: stroke-dashoffset transition 500ms ease-out + 2s 펄스 애니메이션
      - 중앙 텍스트: scale 브리딩 애니메이션
      - 시트 썸네일 완성 시 fadeIn 300ms
      - 생성중 하위 텍스트: ::after 점 애니메이션 (...)
    </loading_states>
  </animations>

  <responsive_design>
    <breakpoints>
      - mobile: 0–639px (max-sm: 접두사)
      - desktop: 640px+ (기본)
      - 컨테이너: max-width 720px, 중앙 정렬
    </breakpoints>
    <mobile_adaptations>
      - 스타일 그리드: 2열 유지 (모바일에서도)
      - 이모티콘 구성 목록: 2열 → 1열
      - 이모티콘 그리드: 4열 → 3열
      - 모달: 이전/다음 버튼 position fixed bottom
      - 전체 padding: 24px → 16px
      - 스텝 인디케이터: 숫자 숨기고 원만 표시
    </mobile_adaptations>
  </responsive_design>

  <icons>
    - 시스템 이모지 사용 (외부 아이콘 라이브러리 없음)
    - 카메라: 📷, 다운로드: 📦, 재생성: 🔄, 체크: ✓, 에러: ✕
    - 스타일 프리셋: 🎨🌸✏️🧸🎌📸
    - AI 추천: ✨, 편집: ✏️, 시트 재생성: ↻
  </icons>
</aesthetic_guidelines>

<seo_and_meta>
  - 페이지 타이틀: "Emoticon Maker - AI 이모티콘 생성 | 사진으로 이모티콘 24종 만들기"
  - meta description, keywords, author, robots, theme-color
  - Open Graph: og:type, og:title, og:description, og:url, og:site_name, og:locale
  - Twitter Card: twitter:card, twitter:title, twitter:description
  - Canonical URL: https://revfactory.github.io/emoticon-maker/
  - License meta: Apache-2.0 WITH Commons Clause
</seo_and_meta>

<security_considerations>
  <api_key_handling>
    - CRITICAL: API 키는 sessionStorage에만 저장. localStorage 사용 금지.
    - CRITICAL: API 키를 DOM에 노출하지 않는다 (data 속성, hidden input 등 금지)
    - CRITICAL: API 키를 URL 파라미터, 쿠키, 로그에 포함하지 않는다
    - 키 입력 필드: type="password" 기본, 토글로 표시 가능
    - 키 마스킹 표시: "AIza...7gJ" (앞 4자 + ... + 뒤 3자)
    - 탭/브라우저 종료 시 자동 삭제 (sessionStorage 특성)
  </api_key_handling>
  <client_security>
    - CRITICAL: 모든 API 호출은 브라우저에서 직접. 프록시 서버 없음.
    - CSP 헤더: GitHub Pages 기본값 사용
    - 사용자 업로드 이미지: FileReader로 로컬 처리, 외부 서버 전송 없음 (Gemini API 제외)
    - XSS 방지: 사용자 입력(캐릭터 이름, 커스텀 프롬프트)을 textContent로만 삽입
  </client_security>
  <data_privacy>
    - 사용자 사진은 브라우저 밖으로 나가지 않음 (Gemini API 호출 시에만 전송)
    - 생성된 이미지는 IndexedDB에만 저장, 서버 업로드 없음
    - Google Analytics로 사용자 행동 이벤트 추적 (개인정보 미포함)
  </data_privacy>
</security_considerations>

<advanced_functionality>
  <parallel_batch_generation>
    - 시트 4장을 2개 배치로 병렬 생성
    - 배치 1 (시트 0+1) → 2초 대기 → 배치 2 (시트 2+3)
    - Promise.allSettled으로 부분 실패 허용
    - 완료 카운터를 공유 참조 객체로 관리 (병렬 실행 시 atomic 증가)
    - 각 시트 완성 시 즉시 분할 + 미리보기 + IndexedDB 저장
  </parallel_batch_generation>

  <individual_sheet_regeneration>
    - 시트 썸네일 옆 ↻ 버튼으로 개별 시트 재생성
    - 시트 모달에서 "이 시트 재생성" 버튼
    - 재생성 시 해당 시트만 새로 생성 + 분할 + 기존 결과 교체
    - 썸네일 상태: generating → done/error 전환
  </individual_sheet_regeneration>

  <sheet_modal_preview>
    - 생성 중 시트 썸네일 클릭 시 모달로 원본 크기 확대
    - 이전/다음 시트 탐색 (4개 순환)
    - 모달 내 개별 재생성 트리거
    - sheetModalMode 플래그로 이모티콘 모달과 구분
  </sheet_modal_preview>

  <style_prompt_generation>
    - 각 스타일 프리셋에 최적화된 Gemini 프롬프트 템플릿 내장
    - 실사화(isRealistic) 스타일: 별도 프롬프트 분기
      - 실제 사진 리얼리즘, 틸트시프트, 자연 조명, 흰 배경
      - "NOT a 3D render, NOT a toy, NOT a figurine, NOT clay, NOT plastic"
    - 동물 사진 지원: "The subject could be a person, cat, dog, or any living being"
    - 사진 특징 보존: 색상, 무늬, 얼굴 형태, 털/머리카락, 액세서리
  </style_prompt_generation>

  <ai_style_suggestions>
    - Gemini(gemini-3.1-pro-preview)로 3개 스타일 동적 생성
    - 기존 프리셋과 겹치지 않는 독창적 스타일 제안
    - 예: 수묵화, 팝아트, 레트로 픽셀, 클레이 애니메이션 등
    - 누적 추가: 기존 추천 유지하고 새로 추가
    - 선택 상태 보존: 새 추천 추가 후 기존 선택 유지
  </ai_style_suggestions>
</advanced_functionality>

<final_integration_test>
  <scenario name="정상 흐름 E2E">
    1. index.html 접속 → API 키 입력 화면 표시
    2. 유효한 Gemini API 키 입력 → 모델 목록 조회로 검증 → "확인됨" 표시 → 사진 업로드 화면 전환
    3. 인물/동물 사진 드래그앤드롭 (최대 3장) → 그리드 미리보기 표시
    4. "지브리풍" 스타일 선택 → "캐릭터 만들기" 클릭
    5. 베이스 캐릭터 생성 (자동 재시도 포함, 10~20초) → 결과 확인
    6. 캐릭터 이름 입력 → "이 캐릭터로 진행" 클릭
    7. AI가 24개 이모티콘 구성 생성 → 목록 확인 + 필요 시 인라인 편집
    8. "이대로 만들기" 클릭 → 이모티콘 시트 병렬 배치 생성 시작
    9. 시트 4장 (2+2 배치) 생성, 프로그레스 링 + 썸네일 업데이트
    10. 생성 완료 → "완성 보기" 클릭 → 24개 이모티콘 그리드 + 메인 이미지 표시
    11. 이모티콘 클릭 → 모달로 확대, ←→ 탐색, ESC 닫기
    12. ZIP 다운로드 → "{캐릭터이름}_emoticons.zip" 저장
    13. ZIP 내용 확인: main.png + 01.png~24.png (총 25개 파일)
  </scenario>

  <scenario name="베이스 캐릭터 재생성">
    1. 베이스 캐릭터 확인 화면에서 "🔄 다시 만들기" 클릭
    2. 같은 스타일로 새 캐릭터 생성 (자동 재시도 포함)
    3. 스켈레톤 표시 → 새 이미지로 전환
    4. "← 스타일 변경" 클릭 → 스타일 선택 화면으로 복귀
  </scenario>

  <scenario name="시트 부분 실패 + 개별 재생성">
    1. 시트 배치 생성 중 시트 3 API 에러 발생
    2. 시트 0, 1, 3은 정상 완료, 시트 2는 sheet-error 상태
    3. "실패한 시트 재시도" 버튼 표시
    4. 또는 시트 2 썸네일의 ↻ 버튼으로 개별 재생성
    5. 재생성 성공 → 나머지 시트 결과와 합쳐서 완성
  </scenario>

  <scenario name="페이지 새로고침 복원">
    1. 이모티콘 생성 완료 상태에서 F5 새로고침
    2. sessionStorage에서 API 키 복원
    3. IndexedDB에서 이모티콘 데이터 복원 (24개 + mainImage)
    4. 완성 화면 그대로 표시 (이모티콘 그리드 + 다운로드 버튼)
    5. 주의: 레이블은 FALLBACK_DEFINITIONS로 대체됨 (원본 AI 생성 레이블 복원 불가)
  </scenario>

  <scenario name="동물 사진으로 이모티콘 생성">
    1. 고양이/강아지 사진 업로드
    2. 스타일 선택 후 캐릭터 생성
    3. AI가 자동으로 동물 종 인식하여 동일 종 캐릭터 생성
    4. 24개 이모티콘도 해당 동물 캐릭터로 일관성 유지
  </scenario>
</final_integration_test>

<success_criteria>
  - 사진 업로드 → 24종 이모티콘 완성까지 약 2~3분
  - 모든 이모티콘 360x360px PNG 투명 배경
  - ZIP 다운로드 파일에 25개 파일 (main.png + 01~24.png)
  - 모바일 Safari/Chrome에서 정상 동작
  - API 키가 sessionStorage 외부로 유출되지 않음
  - 사람 및 동물(고양이, 강아지 등) 사진 모두 지원
  - 시트 부분 실패 시 개별 재생성 가능
  - 페이지 새로고침 시 완성된 세트 복원
</success_criteria>

<build_output>
  <files>
    - index.html (HTML 구조 + Tailwind 설정 + 메타 태그)
    - style.css (커스텀 CSS 스타일)
    - app.js (전체 앱 로직)
    - README.md (프로젝트 설명)
    - LICENSE (Apache 2.0 + Commons Clause)
  </files>
  <deployment>
    - GitHub Pages에 직접 배포 (main 브랜치 루트)
    - 빌드 단계 없음
    - CDN 의존성: esm.sh (@google/genai), cdnjs (JSZip, FileSaver), cdn.tailwindcss.com (Tailwind), cdn.jsdelivr.net (Pretendard)
  </deployment>
</build_output>

<key_implementation_notes>
  <implementation_order>
    1. HTML 기본 구조 (index.html) + Tailwind CSS 설정 + 메타 태그/SEO
    2. 커스텀 CSS (style.css) — 디자인 시스템 (색상, 타이포, 컴포넌트)
    3. 스텝 위자드 네비게이션 (7단계, 클릭 가능한 스텝 인디케이터)
    4. API 키 입력 + 모델 목록 조회로 검증 (sessionStorage)
    5. 사진 업로드 (드래그앤드롭 + 파일 선택 + 최대 3장 + 그리드 미리보기)
    6. 스타일 선택 UI (탭 기반: 프리셋 6종 + AI 추천 + 직접 입력)
    7. Gemini API 연동 — 베이스 캐릭터 생성 (자동 재시도, 동물 지원)
    8. 베이스 리뷰 화면 (확정/재생성/스타일변경)
    9. 이모티콘 구성 생성 — Gemini로 24개 감정/상황 목록 동적 생성 + 인라인 편집 UI
    10. 이모티콘 시트 병렬 배치 생성 + OffscreenCanvas 분할 + 흰→투명 변환
    11. 프로그레스 UI (원형 SVG + 시트 썸네일 스트립 + 시트 모달)
    12. 완성 화면 (그리드 + 모달 + ZIP 다운로드)
    13. IndexedDB 캐싱 + 새로고침 복원
    14. 반응형 모바일 대응
    15. 에러 핸들링 + 토스트
    16. Google Analytics 이벤트 추적
  </implementation_order>

  <critical_paths>
    - Gemini API의 이미지 응답 파싱: base64 → Blob 변환이 핵심. inlineData.data 필드에서 추출.
    - OffscreenCanvas 시트 분할: 그리드 라인 마진 처리 + 흰→투명 변환 정확도가 이모티콘 품질을 결정.
    - 병렬 배치 생성: Promise.allSettled로 부분 실패 허용 + 공유 카운터로 진행률 관리.
    - 동적 SDK 로드: import('https://esm.sh/@google/genai')로 file:// 프로토콜 지원.
    - 동물/사람 범용 프롬프트: subject 자동 인식 + 동일 종 유지가 캐릭터 일관성의 핵심.
  </critical_paths>

  <gemini_api_usage_pattern>
    ```javascript
    // CDN에서 SDK 동적 로드
    const module = await import('https://esm.sh/@google/genai');
    const GoogleGenAI = module.GoogleGenAI;

    const ai = new GoogleGenAI({ apiKey });

    // 이미지 생성
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Photo } }
        ]
      }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '3:2', imageSize: '2K' } // 시트 전용
      }
    });

    // 이미지 추출
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const blob = base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
        // blob 사용
      }
    }
    ```
  </gemini_api_usage_pattern>

  <canvas_splitting_pattern>
    ```javascript
    // 시트를 6등분하여 개별 이모티콘 추출
    async function splitSheet(sheetBlob, startIndex) {
      const img = await createImageBitmap(sheetBlob);
      const cellW = img.width / 3;
      const cellH = img.height / 2;
      const results = [];

      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const canvas = new OffscreenCanvas(360, 360);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 360, 360);

          // 마진 적용하여 그리드 라인 아티팩트 방지
          const margin = Math.max(3, cellW * 0.01);
          ctx.drawImage(img,
            col * cellW + margin, row * cellH + margin,
            cellW - margin * 2, cellH - margin * 2,
            0, 0, 360, 360
          );

          // 흰색 → 투명 변환 (edge smoothing 포함)
          removeWhiteBackground(ctx, 360, 360);

          const blob = await canvas.convertToBlob({ type: 'image/png' });
          results.push({
            index: startIndex + row * 3 + col,
            blob,
            label: state.emoticonDefinitions[index]?.label || `#${index + 1}`
          });
        }
      }
      return results;
    }
    ```
  </canvas_splitting_pattern>

  <retry_pattern>
    ```javascript
    // Gemini API 재시도 래퍼
    async function callGeminiWithRetry(fn, maxRetries = 3) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          const msg = err.message || '';
          if ((msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && attempt < maxRetries - 1) {
            showToast('잠시 대기 중... (API 제한)', 'info');
            await delay(5000);
            continue;
          }
          throw err;
        }
      }
    }
    ```
  </retry_pattern>
</key_implementation_notes>

</project_specification>
