<project_specification>

<project_name>Emoticon Maker - AI 이모티콘 생성 서비스</project_name>

<overview>
사진 한 장에서 카카오 이모티콘 24종 세트를 자동 생성하는 서버리스 웹 서비스. 사용자가 인물 사진을 업로드하면 AI가 다양한 스타일(지브리풍, 병맛, 미니멀 등)을 제안하고, 선택한 스타일로 베이스 캐릭터를 생성한 후 24개 감정/상황 이모티콘을 자동 생성한다. 완성된 세트는 미리보기 페이지에서 확인하고 ZIP으로 다운로드할 수 있다.

모든 AI 기능은 Google Gemini API를 통해 브라우저에서 직접 호출한다. 별도 백엔드 서버 없이 GitHub Pages에서 정적 호스팅되며, 사용자의 Gemini API 키는 브라우저 세션에만 보관하고 서버로 전송하지 않는다. 생성된 이미지는 IndexedDB에 캐시하여 페이지 새로고침에도 유지된다.

CRITICAL: 백엔드 서버가 없다. 모든 API 호출은 브라우저에서 직접 수행한다. API 키는 sessionStorage에만 저장하고, 탭/브라우저 종료 시 자동 삭제된다. 이미지 데이터는 IndexedDB에 Blob으로 저장하며, localStorage는 사용하지 않는다 (용량 제한 5MB).
</overview>

<scope_boundaries>
  <in_scope>
    - Gemini API 키 입력 및 세션 관리
    - 인물 사진 업로드 (드래그앤드롭 + 파일 선택)
    - AI 스타일 제안 (5종 프리셋 + AI 추천 스타일 + 직접 입력 탭)
    - 베이스 캐릭터 생성 및 재생성
    - 24종 이모티콘 시트(3x2 그리드) 생성 + Canvas API 분할
    - 개별 이모티콘 360x360 PNG 투명배경 변환
    - 메인 이미지(240x240) + 탭 이미지(96x74) 자동 생성
    - 이모티콘 미리보기 페이지 (그리드 + 모달 탐색)
    - 전체 세트 ZIP 다운로드
    - 생성 진행률 표시
    - IndexedDB 기반 이미지 캐싱
    - 반응형 모바일 레이아웃
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
  </out_of_scope>
  <future_considerations>
    - GIF 움직이는 이모티콘 생성 (Phase 2)
    - 이모티콘 개별 재생성/교체 (Phase 2)
    - 라인/카카오 규격 선택 (Phase 2)
    - 히스토리 관리 — 이전 생성 세트 목록 (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <frontend_application>
    <framework>Vanilla JavaScript (ES2022+) — 빌드 도구 없이 단일 HTML로 구성. GitHub Pages 직접 배포.</framework>
    <styling>Inline CSS + CSS Custom Properties — 외부 의존성 없이 단일 파일 유지</styling>
    <state_management>클래스 기반 상태 관리 (AppState 싱글턴). UI 업데이트는 DOM 직접 조작.</state_management>
    <note>CRITICAL: 빌드 단계 없음. index.html 하나로 모든 기능 포함. GitHub Pages에 그대로 배포.</note>
  </frontend_application>
  <data_layer>
    <cache>IndexedDB (idb-keyval 패턴으로 직접 구현) — 생성된 이미지 Blob 저장</cache>
    <session>sessionStorage — API 키, 현재 세션 상태</session>
    <note>localStorage는 사용하지 않는다 (5MB 제한으로 이미지 저장 불가). IndexedDB는 수백MB 가용.</note>
  </data_layer>
  <ai_integration>
    <sdk>Google Gen AI SDK (@google/genai) — CDN으로 로드. 브라우저에서 직접 Gemini API 호출.</sdk>
    <model_image>gemini-3.1-flash-image-preview — 이미지 생성/편집</model_image>
    <model_text>gemini-3.1-pro-preview — 스타일 분석, 프롬프트 생성, AI 스타일 추천</model_text>
    <note>멀티턴 채팅으로 베이스 캐릭터 참조하며 시트 생성. response_modalities: ['TEXT', 'IMAGE'].</note>
  </ai_integration>
  <libraries>
    <genai>@google/genai (CDN, ESM) — Gemini API 클라이언트</genai>
    <jszip>JSZip v3.10 (CDN) — ZIP 파일 생성</jszip>
    <filesaver>FileSaver.js v2.0 (CDN) — 브라우저 다운로드 트리거</filesaver>
  </libraries>
  <build_output>
    <build_command>없음 — 정적 파일 직접 배포</build_command>
    <note>index.html + 아이콘/폰트 에셋만으로 구성. CDN 의존성은 importmap으로 관리.</note>
  </build_output>
</technology_stack>

<prerequisites>
  <environment_setup>
    - 모던 브라우저 (Chrome 90+, Safari 15+, Firefox 90+)
    - Canvas API 지원 (모든 모던 브라우저)
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
├── index.html                     # 전체 앱 (HTML + CSS + JS 단일 파일)
├── favicon.ico                    # 파비콘
├── og-image.png                   # 소셜 미리보기 이미지
└── .nojekyll                      # GitHub Pages Jekyll 비활성화
</file_structure>

<core_data_entities>
  <session_state>
    - apiKey: string (sessionStorage, 암호화 없음 — 세션 한정)
    - currentStep: enum (api_key, upload, style, base_review, emoticon_list, generating, complete)
    - emoticonDefinitions: Array of { label: string, prompt: string } (Gemini가 생성한 24개 목록)
    - uploadedPhoto: Blob (원본 사진)
    - uploadedPhotoUrl: string (Object URL)
    - selectedStyle: object { id: string, name: string, prompt: string }
    - customPrompt: string (사용자 직접 입력 프롬프트)
    - baseCharacter: Blob (생성된 베이스 캐릭터 이미지)
    - baseCharacterUrl: string (Object URL)
  </session_state>

  <emoticon_set>
    - id: string (timestamp 기반)
    - characterName: string (사용자 입력, 기본값 "My Character")
    - baseImage: Blob (베이스 캐릭터)
    - sheets: Blob[] (4장의 시트 이미지)
    - emoticons: Array of { index: number, blob: Blob, label: string } (24개)
    - mainImage: Blob (240x240)
    - tabImage: Blob (96x74)
    - createdAt: Date
    - status: enum (generating, partial, complete, failed)
    - progress: { current: number, total: number } (생성 진행률)
  </emoticon_set>

  <style_preset>
    - id: string
    - name: string (표시명, 예: "지브리풍")
    - description: string (1줄 설명)
    - thumbnailEmoji: string (대표 이모지)
    - prompt: string (Gemini 프롬프트 템플릿)
  </style_preset>

  <emoticon_definition>
    - index: number (1~24)
    - label: string (한글 레이블, 예: "인사/안녕")
    - prompt: string (영문 Gemini 프롬프트)
    - category: enum (emotion, situation)
  </emoticon_definition>
</core_data_entities>

<authentication>
  CRITICAL: 인증 시스템 없음. API 키만 세션 단위로 관리.

  - 첫 접속 시 API 키 입력 화면 표시
  - 키 유효성 검증: Gemini API에 간단한 텍스트 요청으로 확인
  - 유효하면 sessionStorage에 저장, 다음 단계로 이동
  - 무효하면 인라인 에러 메시지 + 재입력 유도
  - 탭 종료 시 자동 삭제 (sessionStorage 특성)
  - "키 변경" 버튼으로 언제든 재입력 가능
</authentication>

<route_definitions>
  CRITICAL: SPA가 아닌 단일 페이지. URL 라우팅 없음. 스텝 기반 위자드 UI.

  전체 흐름은 하나의 index.html 내에서 단계별 화면 전환으로 구현:
  Step 1: API 키 입력
  Step 2: 사진 업로드
  Step 3: 스타일 선택
  Step 4: 베이스 캐릭터 확인
  Step 5: 이모티콘 구성 확인 (AI 생성 24개 목록)
  Step 6: 이모티콘 생성 (진행률)
  Step 7: 완성 미리보기 + 다운로드
</route_definitions>

<component_hierarchy>
  <app>
    <header>                          <!-- 로고 + 스텝 인디케이터 + 키 변경 버튼 -->
      <logo />                        <!-- "Emoticon Maker" 텍스트 로고 -->
      <step_indicator />              <!-- 1→2→3→4→5→6 프로그레스 -->
      <key_status />                  <!-- API 키 상태 + 변경 버튼 -->
    </header>

    <main>                            <!-- 스텝별 화면 전환 영역 -->
      <!-- Step 1 -->
      <api_key_screen>
        <key_input />                 <!-- API 키 입력 필드 + 안내 텍스트 -->
        <validate_button />
      </api_key_screen>

      <!-- Step 2 -->
      <upload_screen>
        <drop_zone />                 <!-- 드래그앤드롭 + 파일 선택 -->
        <photo_preview />             <!-- 업로드된 사진 미리보기 -->
      </upload_screen>

      <!-- Step 3 -->
      <style_screen>
        <photo_thumbnail />           <!-- 업로드한 사진 작게 표시 -->
        <style_tabs>                  <!-- "추천 스타일" / "직접 입력" 탭 -->
          <recommended_tab>
            <style_grid />            <!-- 5개 프리셋 + AI 추천 카드 + AI 추천 더 받기 -->
          </recommended_tab>
          <custom_tab>
            <custom_prompt_input />   <!-- 텍스트 영역 독립 표시 -->
          </custom_tab>
        </style_tabs>
        <generate_base_button />
      </style_screen>

      <!-- Step 4 -->
      <base_review_screen>
        <base_image_display />        <!-- 생성된 베이스 캐릭터 크게 표시 -->
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
        <emoticon_list_grid />        <!-- 2열 그리드, 24개 항목 + ✏️ 인라인 편집 -->
        <action_buttons>
          <confirm_list_button />     <!-- "이대로 만들기 →" -->
        </action_buttons>
      </emoticon_list_screen>

      <!-- Step 6 -->
      <generating_screen>
        <progress_ring />             <!-- 원형 프로그레스 (0/4 시트) -->
        <progress_detail />           <!-- "시트 2/4 생성 중... (이모티콘 7~12)" -->
        <sheet_preview_strip />       <!-- 완성된 시트 썸네일 순차 표시 -->
      </generating_screen>

      <!-- Step 7 -->
      <complete_screen>
        <character_header />          <!-- 캐릭터 이름 + 베이스 이미지 -->
        <special_images />            <!-- 메인(240x240) + 탭(96x74) -->
        <emoticon_grid />             <!-- 4x6 그리드 24개 이모티콘 -->
        <emoticon_modal />            <!-- 클릭 시 확대 + 이전/다음 -->
        <download_section>
          <download_zip_button />     <!-- 전체 ZIP 다운로드 -->
          <new_set_button />          <!-- 새 이모티콘 만들기 -->
        </download_section>
      </complete_screen>
    </main>

    <footer>                          <!-- "© 2026 Hwang Minho (revfactory@gmail.com)" -->
  </app>

  <shared>
    <loading_overlay />               <!-- 반투명 오버레이 + 스피너 -->
    <toast />                         <!-- 성공/에러/정보 알림 -->
    <confirm_dialog />                <!-- 확인 다이얼로그 -->
  </shared>
</component_hierarchy>

<pages_and_interfaces>
  <global_layout>
    - 최대 너비: 720px, 중앙 정렬, 좌우 padding 24px
    - 배경: #FAFAFA
    - 헤더 높이: 64px, 하단 border 1px solid #E5E5E5
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
    - 확인 버튼: 전체 너비, height 48px, background #111111, color #FFFFFF, border-radius 12px, font-weight 600
      - hover: background #333333
      - loading: 스피너 아이콘 + "확인 중..."
    - 에러 상태: 입력 필드 border-color #EF4444, 하단에 에러 메시지 (13px, #EF4444)
    - 성공: 녹색 체크 아이콘 + "키가 확인되었습니다" → 0.5초 후 자동 전환
  </step1_api_key>

  <step2_upload>
    - 드롭존: 점선 border 2px dashed #D0D0D0, border-radius 20px, 높이 320px
      - 중앙: 카메라 아이콘 (48px, #CCCCCC) + "사진을 드래그하거나 클릭하세요" (16px, #888888)
      - 하단: "JPG, PNG, WebP (최대 10MB)" (13px, #BBBBBB)
      - hover: border-color #111111, background rgba(0,0,0,0.02)
      - 드래그 오버: border-color #111111, background rgba(0,0,0,0.04), scale(1.01)
    - 업로드 후: 드롭존이 사진 미리보기로 전환
      - 사진: max-height 400px, object-fit contain, border-radius 16px
      - 하단 버튼 2개: "다른 사진 선택" (ghost) + "다음 단계 →" (primary)
    - 파일 검증:
      - 허용 형식: image/jpeg, image/png, image/webp
      - 최대 크기: 10MB
      - 실패 시 토스트 에러 메시지
  </step2_upload>

  <step3_style>
    - 상단: 업로드한 사진 썸네일 (80x80, border-radius 50%, border 3px solid #FFFFFF, shadow)
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
      - 프리셋 5종:
        1. 🎨 병맛 스케치 — "대충 그린 듯한 뀨여운 병맛 캐릭터"
        2. 🌸 지브리풍 — "미야자키 스타일 수채화 감성"
        3. ✏️ 미니멀 라인 — "심플한 선화, 최소 디테일"
        4. 🧸 귀여운 3D — "쫀득쫀득 마시멜로 3D 캐릭터"
        5. 🎌 애니메이션 — "일본 애니메이션 스타일 SD 캐릭터"
      - AI 추천 카드: Gemini(gemini-3.1-pro-preview)가 사진 분석 후 추천한 스타일 카드
        - 사진 업로드 시 자동으로 AI 추천 스타일 1개 생성
      - "✨ AI 테마 추천 더 받기" 점선 카드 (그리드 마지막 위치)
        - 점선 border, 클릭 시 Gemini(gemini-3.1-pro-preview)로 3개 새 스타일 동적 생성
        - 누적 추가 가능 (기존 추천 유지하고 새로 추가)
        - 로딩 중 스피너 표시

    [직접 입력 탭]
    - 텍스트 영역만 독립 표시
      - placeholder: "원하는 스타일을 설명해주세요 (예: 피카소 큐비즘 스타일, 파스텔 톤)"
      - height 120px, border-radius 12px, resize: vertical

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
      - 로딩 오버레이 + 기존 이미지 fade-out → 새 이미지 fade-in
  </step4_base_review>

  <step5_emoticon_list>
    - 타이틀: "이모티콘 구성을 확인하세요" (22px, #111111, 700)
    - 설명: "AI가 제안한 24가지 감정/상황입니다." (14px, #888888)
    - 로딩 상태: 스켈레톤 리스트 (24개 줄, pulse 애니메이션)
    - 목록 그리드: 2열, gap 8px
      - 각 항목: padding 12px 16px, border-radius 12px, background #FFFFFF, border 1px solid #F0F0F0
        - 좌측: 번호 (13px, #CCCCCC, 고정 24px 너비)
        - 중앙: 한글 레이블 (14px, #111111, 600)
        - 하단: 영문 설명 (12px, #AAAAAA, 1줄 ellipsis)
        - 우측: ✏️ 연필 아이콘 (인라인 편집 트리거)
      - hover: background #F9F9F9
      - 인라인 편집 모드 (✏️ 클릭 시):
        - label(한글) input + prompt(영문) textarea로 전환
        - 저장 시 state.emoticonDefinitions에 직접 반영
        - 편집 완료 후 원래 표시 모드로 복귀
    - 액션 버튼:
      - "이대로 만들기 →" (primary, 전체 너비, height 48px)
    - 모바일: 1열 레이아웃
  </step5_emoticon_list>

  <step6_generating>
    - 원형 프로그레스: 중앙, 160px, stroke 6px
      - 배경 원: #E5E5E5
      - 진행 원(fg-circle): #111111, stroke-dasharray 애니메이션 + 2초 주기 opacity 펄스
      - 중앙 텍스트: "2/4" (32px, 700) + scale 브리딩 애니메이션
      - 하단 텍스트: "시트 2 생성 중..." (14px, #888888) + ::after 점 애니메이션 (...)
    - 완성된 시트 미리보기: 가로 스크롤 스트립
      - 각 시트 썸네일: 120x80px, border-radius 8px, 순차적 fade-in (300ms)
      - 미완성: 빈 박스 + 점선 border
    - 예상 시간: "약 1~2분 소요" (13px, #BBBBBB)
    - 취소 버튼 없음 (API 호출 취소 불가)
    - 에러 발생 시: 실패한 시트만 "재시도" 버튼 표시
  </step5_generating>

  <step6_complete>
    - 헤더 영역: 캐릭터 이름 (28px, 700) + 베이스 이미지 (80x80, 원형)
    - 스페셜 이미지 섹션:
      - 메인 이미지 (240x240) + 탭 이미지 (96x74) 나란히
      - 라벨: "메인 240×240" / "탭 96×74" (12px, #AAAAAA)
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
      - 레이블 + 번호
      - 이전/다음 버튼: 노란색(#FFE812) 배경, border-radius 12px
        - flex 기반 배치 (position: static, gap: 16px) — 기존 absolute 배치 대신
        - 모바일: position: fixed, bottom: 16px
      - 키보드: ←→ 탐색, ESC 닫기
      - 배경 클릭으로 닫기
    - 다운로드 섹션:
      - ZIP 다운로드 버튼: 전체 너비, height 56px, background #111111, color #FFFFFF
        - 아이콘: 📦 + "전체 다운로드 (ZIP)"
        - 다운로드 중: 프로그레스 바 + "압축 중..."
        - 파일명: "{캐릭터이름}_emoticons.zip"
      - "새 이모티콘 만들기" 링크 버튼 (하단, ghost)
    - 모바일: 3열 그리드, 모달 full-screen 시트로 변환
  </step6_complete>
</pages_and_interfaces>

<core_functionality>
  <gemini_api_integration>
    - @google/genai SDK를 ESM CDN (esm.sh)에서 import
    - GoogleGenAI 클라이언트를 사용자 입력 API 키로 초기화
    - 키 검증: models.generateContent로 간단한 텍스트 요청 → 200이면 유효
    - 이미지 생성: response_modalities ['TEXT', 'IMAGE'], image_config 사용
    - 멀티턴 채팅: chats.create로 베이스 캐릭터 참조하며 시트 생성
    - 이미지 응답 처리: response.parts에서 inline_data.data (base64) → Blob 변환
    - 에러 핸들링: 429(레이트 리밋) → 5초 대기 후 재시도, 400(안전 필터) → 프롬프트 수정 안내
  </gemini_api_integration>

  <base_character_generation>
    - 사용자 사진 + 선택된 스타일 프롬프트를 조합
    - Gemini에 사진을 참조 이미지로 전달: contents에 [prompt, image_input]
    - 생성 설정: aspect_ratio "1:1", image_size "2K"
    - 결과를 IndexedDB에 저장
    - "다시 만들기" 시 동일 프롬프트로 재호출 (Gemini의 랜덤성으로 다른 결과)
  </base_character_generation>

  <emoticon_set_generation>
    - 24개 이모티콘을 4장의 시트(각 6개, 3x2 그리드)로 생성
    - 각 시트마다 Gemini API 호출 (베이스 캐릭터를 참조 이미지로 포함)
    - 시트 프롬프트: 캐릭터 특징 + 6개 감정/상황 설명 + 스타일 룰
      - 강화 지시문: "EXACTLY 6 characters, NOT more, NOT less"
      - "NO grid lines, NO borders, NO dividers, NO separators"
      - "Do NOT add any text, labels, or Korean/English words"
    - 시트 imageConfig: { aspectRatio: '3:2', imageSize: '2K' }
    - 시트 생성은 순차 실행 (API 레이트 리밋 보호, 시트 간 2초 딜레이)
    - 각 시트 완성 시 즉시 미리보기 표시 + 진행률 업데이트
  </emoticon_set_generation>

  <sheet_splitting>
    - Canvas API로 시트를 6등분 (3열 x 2행 균등 분할)
    - 각 셀에서 콘텐츠 영역 감지: 비-흰색 픽셀의 바운딩박스 계산
    - 정사각형으로 확장 (중심 유지) + 여백 5% 추가
    - 흰색 배경 → 투명 변환: RGB 모두 235 이상인 픽셀의 알파를 0으로
    - 360x360으로 리사이즈 (Canvas drawImage)
    - canvas.toBlob('image/png')으로 Blob 추출
    - 메인 이미지: 01번 이모티콘을 240x240으로 리사이즈
    - 탭 이미지: 01번 이모티콘을 96x74으로 리사이즈
  </sheet_splitting>

  <zip_download>
    - JSZip으로 ZIP 파일 구성:
      - main.png (240x240)
      - tab.png (96x74)
      - 01.png ~ 24.png (360x360)
    - FileSaver.js의 saveAs로 다운로드 트리거
    - 파일명: "{캐릭터이름}_emoticons.zip"
    - 압축 진행률을 UI에 표시
  </zip_download>

  <image_caching>
    - IndexedDB에 'emoticon-maker' 데이터베이스 생성
    - 'images' 오브젝트 스토어: key=string, value=Blob
    - 저장 항목: 원본 사진, 베이스 캐릭터, 시트 4장, 이모티콘 24개, 메인, 탭
    - 페이지 새로고침 시 IndexedDB에서 복원하여 마지막 상태 유지
    - "새 이모티콘 만들기" 시 기존 데이터 삭제
      - fileInput.value = '' 추가
      - 모든 UI 요소 초기화 (베이스 이미지, 스켈레톤, 그리드, 시트 스트립 등)
      - aiSuggestedStyles 초기화
      - 탭 상태 초기화 (추천 스타일 탭으로 복귀)
  </image_caching>

  <emoticon_definitions>
    CRITICAL: 24개 감정/상황 목록은 하드코딩하지 않는다. 매번 Gemini가 새로운 세트를 동적으로 생성한다.

    생성 흐름:
    1. 베이스 캐릭터 확정 후, Gemini(gemini-3.1-pro-preview)에 다음을 요청:
       "이 캐릭터로 카카오 이모티콘 24종을 만들려고 합니다.
        다양한 감정과 일상 상황을 커버하는 24개 이모티콘 목록을 만들어주세요.
        각 항목은 { label: 한글 레이블, prompt: 영문 포즈/표정 설명 } 형태의 JSON 배열로 반환하세요."

    2. Gemini 응답을 JSON 파싱하여 24개 정의 목록을 얻는다.

    3. 파싱 실패 시 폴백: 아래 기본 예시 목록을 사용한다.

    생성 가이드라인 (Gemini 프롬프트에 포함):
    - 필수 카테고리: 인사(1), 감사(1), 사랑(1~2), 슬픔/울음(1), 화남(1), 놀람(1), 웃음(1~2), 긍정(1~2)
    - 일상 상황: 출퇴근, 식사, 커피, 수면, 운동, 공부, 쇼핑 등에서 6~8개
    - 소통 표현: 미안, 축하, 응원, 거절, 비밀, 기다려 등에서 4~6개
    - 인사/작별은 반드시 포함 (첫 번째, 마지막)
    - 각 prompt는 캐릭터의 구체적 포즈/표정/소품을 포함하는 영문 1~2문장
    - 매번 새로운 조합과 표현으로 다양성 확보

    UI 추가 (Step 4.5 — 베이스 확정 후, 생성 시작 전):
    - "이모티콘 구성 확인" 화면을 보여준다
    - Gemini가 생성한 24개 목록을 2열 그리드로 표시
    - 각 항목: 번호 + 한글 레이블 + 영문 설명 미리보기
    - "이대로 만들기 →" 버튼: 확정 후 시트 생성 시작
    - 각 항목에 ✏️ 인라인 편집 기능: label(한글) + prompt(영문)를 직접 수정 가능
    - 저장 시 state.emoticonDefinitions에 즉시 반영

    폴백 예시 목록 (Gemini 실패 시):
    1. 인사/안녕 — waving hello with a big cheerful smile, one hand raised high
    2. 고마워 — bowing deeply with sparkling grateful tears
    3. 사랑해 — heart-shaped eyes, hugging a big red heart
    4. 울음 — sitting on ground crying dramatically, rivers of tears
    5. 화남 — bright red face, steam shooting from ears, fists clenched
    6. 놀람 — jaw dropping to floor, eyes popping out on springs
    7. ㅋㅋㅋ — rolling on floor laughing, tears of joy flying
    8. 좋아요 — enthusiastic double thumbs up, sparkling eyes
    9. 미안 — on knees with puppy dog eyes, hands clasped begging
    10. 축하 — wearing party hat, throwing confetti, excited face
    11. 피곤 — dark circles, soul leaving body as ghost
    12. 싫어 — crossing arms in X shape, disgusted face
    13. 출근 — dragging feet like zombie, briefcase in hand
    14. 퇴근 — sprinting with cape flying, pure joy expression
    15. 밥먹자 — drooling over steaming bowl of rice
    16. 커피 — hugging giant coffee cup lovingly, hearts floating
    17. 잠와 — sleeping with huge snot bubble, ZZZ floating
    18. 운동 — lifting tiny dumbbells with noodle arms, sweating
    19. 공부 — brain exploding, surrounded by stacks of books
    20. 쉿 — finger on lips, shifty suspicious eyes
    21. 쇼핑 — eyes as dollar signs, surrounded by shopping bags
    22. 잠깐 — hand up in stop gesture, stern waiting face
    23. 파이팅 — cheerleading with pom-poms, fired up face
    24. 바이바이 — waving goodbye dramatically, single tear rolling
  </emoticon_definitions>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>
      - 성공: background #111111, color #FFFFFF, 3초 자동 닫힘, 상단 중앙
      - 에러: background #EF4444, color #FFFFFF, 수동 닫힘, 상단 중앙
      - 정보: background #F5F5F5, color #333333, 3초 자동 닫힘
      - 최대 2개 스택, 위에서 아래로
      - 슬라이드 다운 애니메이션 (200ms ease-out)
    </toast_notifications>
    <inline_errors>
      - API 키 무효: "유효하지 않은 API 키입니다. 다시 확인해주세요."
      - 파일 형식 오류: "JPG, PNG, WebP 파일만 업로드할 수 있습니다."
      - 파일 크기 초과: "파일 크기가 10MB를 초과합니다."
      - 이미지 생성 실패: "이미지 생성에 실패했습니다. 다시 시도해주세요."
    </inline_errors>
  </user_facing>
  <api_errors>
    - 400 (안전 필터): "이미지 생성이 차단되었습니다. 다른 사진이나 스타일을 시도해주세요." 토스트
    - 429 (레이트 리밋): 자동 5초 대기 후 재시도, "잠시 대기 중..." 상태 표시
    - 500 (서버 오류): "Gemini 서버 오류입니다. 잠시 후 다시 시도해주세요." 토스트
    - 네트워크 오류: "인터넷 연결을 확인해주세요." 토스트
    - 시트 생성 부분 실패: 성공한 시트는 유지, 실패한 시트만 "재시도" 버튼 표시
  </api_errors>
  <recovery>
    - 페이지 새로고침: IndexedDB에서 마지막 상태 복원
    - 생성 중 새로고침: 완성된 시트까지만 복원, 나머지는 재생성 안내
    - IndexedDB 용량 초과: 이전 세트 삭제 후 재시도
  </recovery>
</error_handling>

<third_party_integrations>
  <integration name="Google Gemini API">
    <purpose>이미지 생성 (텍스트→이미지, 이미지 편집), 텍스트 생성 (프롬프트 최적화)</purpose>
    <sdk>@google/genai via ESM CDN (esm.sh/@google/genai)</sdk>
    <models>
      - gemini-3.1-flash-image-preview: 이미지 생성/편집 (베이스 캐릭터, 이모티콘 시트)
      - gemini-3.1-pro-preview: 텍스트 전용 (키 검증, 스타일 분석, AI 스타일 추천)
    </models>
    <api_pattern>
      - 클라이언트 생성: new GoogleGenAI(apiKey)
      - 이미지 생성: client.models.generateContent({ model, contents, config })
      - 멀티턴: client.chats.create({ model, config })
      - 이미지 입력: { inlineData: { mimeType, data: base64 } }
      - 이미지 출력: response.candidates[0].content.parts → inlineData.data (base64)
    </api_pattern>
    <rate_limits>
      - 무료 티어: 분당 15 요청
      - 시트 간 2초 딜레이로 자체 조절
      - 429 발생 시 5초 대기 후 자동 재시도 (최대 3회)
    </rate_limits>
  </integration>

  <integration name="JSZip">
    <purpose>브라우저에서 ZIP 파일 생성</purpose>
    <sdk>JSZip v3.10 via CDN</sdk>
    <usage>
      - const zip = new JSZip()
      - zip.file("01.png", blob)
      - zip.generateAsync({ type: "blob" })
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
      - Primary: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
      - Mono: 'SF Mono', 'Fira Code', monospace (API 키 입력에만 사용)
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
      - 토스트 퇴장: slideUp + fadeOut 150ms ease-in
    </micro_interactions>
    <page_transitions>
      - 스텝 전환: fadeIn 300ms ease-out (현재 스텝) + fadeOut 200ms (이전 스텝)
      - 베이스 이미지 교체: crossfade 400ms
    </page_transitions>
    <loading_states>
      - 스켈레톤: pulse 1.5s ease-in-out infinite (#E5E5E5 → #F5F5F5)
      - 프로그레스 링: stroke-dashoffset transition 500ms ease-out
      - 시트 완성 시 썸네일 fadeIn 300ms + scale(0.9→1)
    </loading_states>
  </animations>

  <responsive_design>
    <breakpoints>
      - mobile: 0–639px (단일 열, 풀 너비)
      - tablet: 640–1023px (max-width 640px, 중앙)
      - desktop: 1024px+ (max-width 720px, 중앙)
    </breakpoints>
    <mobile_adaptations>
      - 스타일 그리드: 2열 → 1열
      - 이모티콘 그리드: 4열 → 3열
      - 모달: border-radius 0, height auto, bottom sheet 스타일
      - 버튼: 풀 너비 스택
      - 스텝 인디케이터: 숫자 숨기고 원만 표시
    </mobile_adaptations>
    <touch_interactions>
      - 드롭존: 탭으로 파일 선택 (드래그 불가)
      - 이모티콘 모달: 좌우 스와이프로 탐색
      - 최소 탭 타겟: 44x44px
    </touch_interactions>
  </responsive_design>

  <icons>
    - 시스템 이모지 사용 (외부 아이콘 라이브러리 없음)
    - 카메라: 📷, 다운로드: 📦, 재생성: 🔄, 체크: ✓, 에러: ✕
    - 스타일 프리셋: 각 프리셋별 이모지 (🎨🌸✏️🧸🎌🖼️)
  </icons>
</aesthetic_guidelines>

<security_considerations>
  <api_key_handling>
    - CRITICAL: API 키는 sessionStorage에만 저장. localStorage 사용 금지.
    - CRITICAL: API 키를 DOM에 노출하지 않는다 (data 속성, hidden input 등 금지)
    - CRITICAL: API 키를 URL 파라미터, 쿠키, 로그에 포함하지 않는다
    - 키 입력 필드: type="password" 기본, 토글로 표시 가능
    - 키 마스킹 표시: "AIza...7gJ" (앞 4자 + 뒤 3자만 표시)
    - 탭/브라우저 종료 시 자동 삭제 (sessionStorage 특성)
  </api_key_handling>
  <client_security>
    - CRITICAL: 모든 API 호출은 브라우저에서 직접. 프록시 서버 없음.
    - CSP 헤더: GitHub Pages 기본값 사용
    - 사용자 업로드 이미지: FileReader로 로컬 처리, 외부 서버 전송 없음
    - XSS 방지: 사용자 입력(캐릭터 이름, 커스텀 프롬프트)을 textContent로만 삽입, innerHTML 금지
  </client_security>
  <data_privacy>
    - 사용자 사진은 브라우저 밖으로 나가지 않음 (Gemini API 호출 시에만 전송)
    - 생성된 이미지는 IndexedDB에만 저장, 서버 업로드 없음
    - 분석/추적 스크립트 없음 (GA, Mixpanel 등 미포함)
  </data_privacy>
</security_considerations>

<advanced_functionality>
  <progressive_generation>
    - 시트 4장을 순차 생성하며 완성된 시트부터 즉시 분할 + 미리보기 표시
    - 사용자는 생성 중에도 완성된 이모티콘을 확인할 수 있음
    - 각 시트 완성 시 IndexedDB에 즉시 저장 (중간 크래시 대비)
  </progressive_generation>

  <style_prompt_generation>
    - 각 스타일 프리셋에 최적화된 Gemini 프롬프트 템플릿 내장
    - 사진 분석: Gemini로 인물 특징(머리, 안경, 모자, 옷) 자동 추출
    - 추출된 특징을 프롬프트에 자동 삽입하여 캐릭터 일관성 확보
    - 예: "Keep: long wavy black hair, round brown glasses, lavender cap"
  </style_prompt_generation>

  <white_to_transparent>
    - Canvas API로 흰색 배경 → 투명 변환
    - getImageData로 픽셀 데이터 접근
    - R, G, B 모두 235 이상인 픽셀의 Alpha를 0으로 설정
    - putImageData로 결과 적용
    - edge smoothing: 경계 픽셀은 alpha를 점진적으로 조정 (안티앨리어싱)
  </white_to_transparent>
</advanced_functionality>

<final_integration_test>
  <scenario name="정상 흐름 E2E">
    1. index.html 접속 → API 키 입력 화면 표시
    2. 유효한 Gemini API 키 입력 → "확인됨" 표시 → 사진 업로드 화면 전환
    3. 인물 사진 드래그앤드롭 → 미리보기 표시
    4. "지브리풍" 스타일 선택 → "캐릭터 만들기" 클릭
    5. 베이스 캐릭터 생성 (10~20초) → 결과 확인
    6. "이 캐릭터로 진행" 클릭 → 이모티콘 생성 시작
    7. 시트 4장 순차 생성 (각 20~30초), 프로그레스 업데이트
    8. 완성 → 24개 이모티콘 그리드 표시
    9. 이모티콘 클릭 → 모달로 확대, ←→ 탐색
    10. ZIP 다운로드 → "{캐릭터이름}_emoticons.zip" 저장
    11. ZIP 내용 확인: main.png + tab.png + 01.png~24.png (총 26개 파일)
  </scenario>

  <scenario name="베이스 캐릭터 재생성">
    1. 베이스 캐릭터 확인 화면에서 "다시 만들기" 클릭
    2. 같은 스타일로 새 캐릭터 생성
    3. 기존 이미지 → 새 이미지로 crossfade 전환
    4. "스타일 변경" 클릭 → 스타일 선택 화면으로 복귀
  </scenario>

  <scenario name="시트 부분 실패">
    1. 시트 3/4 생성 중 API 에러 발생
    2. 시트 1, 2는 정상 분할 완료
    3. 시트 3에 "재시도" 버튼 표시
    4. 재시도 클릭 → 시트 3 재생성 → 성공
    5. 시트 4 계속 진행
    6. 전체 완성 후 정상 다운로드
  </scenario>

  <scenario name="페이지 새로고침 복원">
    1. 이모티콘 생성 완료 상태에서 F5 새로고침
    2. IndexedDB에서 데이터 복원
    3. 완성 화면 그대로 표시 (이모티콘 그리드 + 다운로드 버튼)
  </scenario>
</final_integration_test>

<success_criteria>
  - 사진 업로드 → 24종 이모티콘 완성까지 3분 이내
  - 모든 이모티콘 360x360px PNG 투명 배경
  - ZIP 다운로드 파일에 26개 파일 (main + tab + 24개)
  - 모바일 Safari/Chrome에서 정상 동작
  - API 키가 sessionStorage 외부로 유출되지 않음
  - 단일 HTML 파일 크기 200KB 이하
  - Lighthouse Performance 점수 90 이상
</success_criteria>

<build_output>
  <files>
    - index.html (단일 파일, HTML + CSS + JS 포함)
    - favicon.ico
    - .nojekyll
  </files>
  <deployment>
    - GitHub Pages에 직접 배포 (main 브랜치 루트)
    - 빌드 단계 없음
    - CDN 의존성: esm.sh (@google/genai), cdnjs (JSZip, FileSaver)
  </deployment>
</build_output>

<key_implementation_notes>
  <implementation_order>
    1. HTML 기본 구조 + CSS 디자인 시스템 (색상, 타이포, 컴포넌트)
    2. 스텝 위자드 네비게이션 (7단계, fadeIn/fadeOut 전환)
    3. API 키 입력 + 검증 (sessionStorage)
    4. 사진 업로드 (드래그앤드롭 + 파일 선택 + 미리보기)
    5. 스타일 선택 UI (탭 기반: 추천 스타일 5종 + AI 추천 + 직접 입력)
    6. Gemini API 연동 — 베이스 캐릭터 생성
    7. 베이스 리뷰 화면 (확정/재생성/스타일변경)
    8. 이모티콘 구성 생성 — Gemini로 24개 감정/상황 목록 동적 생성 + 확인 UI
    9. 이모티콘 시트 생성 + Canvas API 분할 + 흰→투명 변환
    10. 프로그레스 UI (시트별 진행률)
    11. 완성 화면 (그리드 + 모달 + ZIP 다운로드)
    12. IndexedDB 캐싱 + 새로고침 복원
    13. 반응형 모바일 대응
    14. 에러 핸들링 + 토스트
  </implementation_order>

  <critical_paths>
    - Gemini API의 이미지 응답 파싱: base64 → Blob 변환이 핵심. inline_data.data 필드에서 추출.
    - Canvas API 시트 분할: getImageData/putImageData로 픽셀 단위 조작. 흰→투명 변환 정확도가 이모티콘 품질을 결정.
    - 단일 HTML 파일 구조: 모든 CSS/JS가 인라인. 모듈화는 함수/클래스 단위로, 파일 분리 없이.
    - CDN importmap: @google/genai를 ESM으로 로드. type="importmap"으로 패키지 매핑.
  </critical_paths>

  <gemini_api_usage_pattern>
    ```javascript
    // CDN에서 SDK 로드
    import { GoogleGenAI } from '@google/genai';

    const ai = new GoogleGenAI(apiKey);

    // 이미지 생성
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        { role: 'user', parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Photo } }
        ]}
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1', imageSize: '2K' }
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
    function splitSheet(sheetBlob, startIndex) {
      const img = await createImageBitmap(sheetBlob);
      const cellW = img.width / 3;
      const cellH = img.height / 2;
      const results = [];

      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const canvas = new OffscreenCanvas(360, 360);
          const ctx = canvas.getContext('2d');

          // 셀 추출 → 360x360 리사이즈
          ctx.drawImage(img,
            col * cellW + 3, row * cellH + 3,
            cellW - 6, cellH - 6,
            0, 0, 360, 360
          );

          // 흰색 → 투명 변환
          removeWhiteBackground(ctx, 360, 360);

          const blob = await canvas.convertToBlob({ type: 'image/png' });
          results.push({ index: startIndex + row * 3 + col, blob });
        }
      }
      return results;
    }
    ```
  </canvas_splitting_pattern>
</key_implementation_notes>

</project_specification>
