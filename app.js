/**
 * Emoticon Maker - AI 이모티콘 생성
 * Copyright (c) 2026 Hwang Minho (revfactory@gmail.com)
 * Licensed under Apache 2.0 + Commons Clause — 상업적 판매 불가
 * See LICENSE file for details
 */

let GoogleGenAI;

// ===== Constants =====
const STEPS = ['api_key', 'upload', 'style', 'base_review', 'emoticon_list', 'generating', 'complete'];
const MAX_PHOTOS = 3;
const STYLE_PRESETS = [
  { id: 'byungmat', name: '병맛 스케치', emoji: '🎨', description: '대충 그린 듯한 뀨여운 병맛 캐릭터', prompt: 'Create a funny crude sketch style character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) in an intentionally messy and cute doodle style with exaggerated expressions, simple colored pencil look' },
  { id: 'ghibli', name: '지브리풍', emoji: '🌸', description: '미야자키 스타일 수채화 감성', prompt: 'Create a Studio Ghibli / Miyazaki style watercolor character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with soft pastel colors, gentle warm lighting, hand-painted aesthetic with delicate details' },
  { id: 'minimal', name: '미니멀 라인', emoji: '✏️', description: '심플한 선화, 최소 디테일', prompt: 'Create a minimal line art character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with clean simple black outlines, very few details, flat colors, modern minimalist illustration style' },
  { id: 'cute3d', name: '귀여운 3D', emoji: '🧸', description: '쫀득쫀득 마시멜로 3D 캐릭터', prompt: 'Create a cute squishy 3D marshmallow character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with soft round shapes, clay-like texture, pastel colors, adorable chibi proportions, 3D rendered look' },
  { id: 'anime', name: '애니메이션', emoji: '🎌', description: '일본 애니메이션 스타일 SD 캐릭터', prompt: 'Create a Japanese anime style super-deformed (SD/chibi) character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with big expressive eyes, colorful, typical anime cel-shading style' },
  { id: 'realistic', name: '실사화', emoji: '📸', description: '실제 사진처럼 리얼한 캐릭터', prompt: 'Generate a photorealistic 3D render of a cute stylized character based on the reference photo. The character should look like a high-end vinyl art toy or designer collectible figure with slightly oversized head and compact body. Capture the person\'s exact face, hairstyle, skin tone, and accessories. Studio photography lighting, shallow depth of field, soft shadows on white seamless background. Shot with 85mm lens, f/2.8. No illustration, no painting, no cartoon — pure photorealistic 3D render quality', isRealistic: true }
];
let aiSuggestedStyles = [];

const FALLBACK_DEFINITIONS = [
  { label: '안녕!', prompt: 'jumping up energetically with both arms stretched wide open, huge grin, sparkles around, landing pose with one foot up' },
  { label: '고마워', prompt: 'holding a glowing golden star gift forward with both hands, eyes squeezed shut in grateful smile, small happy tears' },
  { label: '사랑해', prompt: 'spinning around with giant pink heart above head, eyes turned into hearts, surrounded by floating smaller hearts and sparkles' },
  { label: '대박 웃김', prompt: 'literally rolling on the floor, slapping the ground, tears of laughter spraying out like fountains, face bright red' },
  { label: '분노폭발', prompt: 'tiny body with massively inflated red head, volcanic eruption from top of head, clenched fists shaking, veins popping' },
  { label: '깜짝!', prompt: 'launched backward into the air from shock, hair standing straight up, eyes as big as saucers, lightning bolt background' },
  { label: '흑흑', prompt: 'sitting in a puddle of own tears that keeps growing, hugging knees, rain cloud directly above head pouring down' },
  { label: '최고!', prompt: 'standing on top of a mountain triumphantly, cape blowing in wind, holding trophy, shooting star behind' },
  { label: '미안해', prompt: 'shrunk to tiny size, hiding behind a huge "sorry" sign, trembling with exaggerated puppy dog eyes and quivering lip' },
  { label: '축하해', prompt: 'popping champagne bottle with confetti explosion, wearing party hat, surrounded by balloons and streamers, dance pose' },
  { label: '피곤...', prompt: 'melting into the floor like liquid, soul visibly floating out of body as ghost, dark circles so deep they look like bruises' },
  { label: '싫어', prompt: 'building a brick wall between self and viewer, peeking over top with disgusted expression, holding "NO" sign' },
  { label: '출근길', prompt: 'zombie-walking with briefcase dragging on ground, tie crooked, one shoe missing, dark storm cloud following overhead' },
  { label: '퇴근!', prompt: 'rocket-launching from office chair into the sky, suit jacket thrown off mid-air, ecstatic freedom expression, speed lines' },
  { label: '밥 먹자', prompt: 'aggressively chopsticking a mountain of food, cheeks stuffed like hamster, steam rising from multiple dishes around' },
  { label: '커피 충전', prompt: 'plugging coffee cup into self like charging a battery, electricity sparks, gauge meter going from 0 to 100, eyes lighting up' },
  { label: '잠 온다', prompt: 'head slowly falling forward then snapping back up repeatedly, massive snot bubble inflating, pillow materializing from thin air' },
  { label: '운동 중', prompt: 'struggling to lift a barbell that is bending from weight, legs wobbling like jelly, sweat drops flying everywhere, determined face' },
  { label: '읽씹 금지', prompt: 'staring intensely at phone screen, tapping it frantically, steam coming from ears, clock ticking in background' },
  { label: '쉿 비밀', prompt: 'wearing detective hat and trench coat, holding magnifying glass, finger on lips, one eye peeking suspiciously to the side' },
  { label: '돈 없음', prompt: 'turning wallet upside down with moths flying out, single tear, empty pockets pulled inside out, wind blowing tumbleweed' },
  { label: '기다려', prompt: 'sitting cross-legged checking wristwatch impatiently, foot tapping rapidly, multiple clock faces spinning around head' },
  { label: '파이팅!', prompt: 'power-up pose with aura flames blazing around body, headband tied tight, fist punching upward breaking through ceiling, determined eyes' },
  { label: '바이바이', prompt: 'riding away on a rainbow while waving with both hands, getting smaller in distance, trail of sparkles behind, blowing kiss' }
];

// ===== App State =====
const state = {
  currentStep: 'api_key',
  apiKey: null,
  ai: null,
  uploadedPhotos: [],  // [{file, url, base64, mime}] 최대 MAX_PHOTOS개
  selectedStyle: null,
  customPrompt: '',
  baseCharacter: null,
  baseCharacterUrl: null,
  baseCharacterBase64: null,
  characterName: 'My Character',
  emoticonDefinitions: [],
  sheets: [],
  emoticons: [],
  mainImage: null,
  failedSheets: [],
  setId: null
};

// ===== IndexedDB =====
const DB_NAME = 'emoticon-maker';
const STORE_NAME = 'images';
let db = null;

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME); };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key, value) {
  if (!db) return;
  try {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { /* graceful degradation */ }
}

async function dbGet(key) {
  if (!db) return null;
  try {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}

async function dbClear() {
  if (!db) return;
  try {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { /* graceful degradation */ }
}

// ===== Utilities =====
function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function maskKey(key) {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-3);
}

// ===== Toast =====
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (container.children.length >= 2) {
    container.firstElementChild.remove();
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toast.appendChild(textSpan);
  if (type === 'error') {
    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.onclick = () => removeToast(toast);
    toast.appendChild(closeBtn);
    duration = 0;
  }
  container.appendChild(toast);
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast) {
  toast.classList.add('exiting');
  setTimeout(() => toast.remove(), 150);
}

// ===== Loading =====
function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }

// ===== Step Navigation =====
function trackEvent(action, params = {}) {
  if (typeof gtag === 'function') gtag('event', action, params);
}

function goToStep(stepName) {
  state.currentStep = stepName;
  trackEvent('step_view', { step_name: stepName, step_index: STEPS.indexOf(stepName) });
  STEPS.forEach(s => {
    const el = document.getElementById(`step-${s}`);
    if (el) el.classList.toggle('active', s === stepName);
  });
  renderStepIndicator();
}

function renderStepIndicator() {
  const container = document.getElementById('stepIndicator');
  container.innerHTML = '';
  const currentIdx = STEPS.indexOf(state.currentStep);
  STEPS.forEach((s, i) => {
    if (i > 0) {
      const line = document.createElement('div');
      line.className = `step-line ${i <= currentIdx ? 'completed' : 'pending'}`;
      container.appendChild(line);
    }
    const STEP_LABELS = ['API 키', '사진 업로드', '스타일 선택', '캐릭터 확인', '구성 확인', '생성 중', '완성'];
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    if (i < currentIdx) dot.classList.add('completed');
    else if (i === currentIdx) dot.classList.add('current');
    else dot.classList.add('pending');
    dot.textContent = i + 1;
    dot.dataset.tooltip = STEP_LABELS[i];
    // 완료된 단계 클릭 시 해당 단계로 이동 (generating 단계 제외)
    if (i < currentIdx && s !== 'generating') {
      dot.classList.add('cursor-pointer');
      dot.addEventListener('click', () => goToStep(s));
    }
    container.appendChild(dot);
  });
}

// ===== Step 1: API Key =====
function initApiKey() {
  const input = document.getElementById('apiKeyInput');
  const submitBtn = document.getElementById('apiKeySubmit');
  const toggleBtn = document.getElementById('toggleKeyVis');
  const errorEl = document.getElementById('apiKeyError');
  const successEl = document.getElementById('apiKeySuccess');

  toggleBtn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  input.addEventListener('input', () => {
    errorEl.textContent = '';
    input.classList.remove('error');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitBtn.click();
  });

  submitBtn.addEventListener('click', async () => {
    const key = input.value.trim();
    if (!key) {
      errorEl.textContent = 'API 키를 입력해주세요.';
      input.classList.add('error');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-inline"></span> 확인 중...';
    errorEl.textContent = '';
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // 모델 목록 조회로 키 검증 (generateContent보다 훨씬 빠름)
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
      if (!resp.ok) throw new Error('Invalid API key');
      state.apiKey = key;
      state.ai = ai;
      sessionStorage.setItem('gemini_api_key', key);
      successEl.classList.remove('hidden');
      successEl.classList.add('flex');
      document.getElementById('keyStatus').classList.remove('hidden');
      document.getElementById('keyStatus').classList.add('flex');
      document.getElementById('keyMask').textContent = maskKey(key);
      setTimeout(() => goToStep('upload'), 500);
    } catch (err) {
      let msg = '유효하지 않은 API 키입니다. 다시 확인해주세요.';
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        msg = '인터넷 연결을 확인해주세요.';
      }
      errorEl.textContent = msg;
      input.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '확인';
    }
  });

  document.getElementById('keyChangeBtn').addEventListener('click', () => {
    state.apiKey = null;
    state.ai = null;
    sessionStorage.removeItem('gemini_api_key');
    document.getElementById('keyStatus').classList.add('hidden');
    document.getElementById('keyStatus').classList.remove('flex');
    input.value = '';
    successEl.classList.add('hidden');
    successEl.classList.remove('flex');
    goToStep('api_key');
  });

  // Restore session
  const savedKey = sessionStorage.getItem('gemini_api_key');
  if (savedKey) {
    state.apiKey = savedKey;
    state.ai = new GoogleGenAI({ apiKey: savedKey });
    document.getElementById('keyStatus').classList.remove('hidden');
    document.getElementById('keyStatus').classList.add('flex');
    document.getElementById('keyMask').textContent = maskKey(savedKey);
    goToStep('upload');
  }
}

// ===== Step 2: Upload =====
function initUpload() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const photoGrid = document.getElementById('photoGrid');
  const uploadActions = document.getElementById('uploadActions');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  document.getElementById('reUploadBtn').addEventListener('click', () => {
    resetAllPhotos();
  });

  document.getElementById('toStyleBtn').addEventListener('click', () => {
    if (state.uploadedPhotos.length > 0) {
      renderStyleThumbs();
      goToStep('style');
    }
  });

  async function handleFiles(files) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (state.uploadedPhotos.length >= MAX_PHOTOS) {
        showToast(`사진은 최대 ${MAX_PHOTOS}장까지 업로드할 수 있습니다.`, 'info');
        break;
      }
      if (!validTypes.includes(file.type)) {
        showToast('JPG, PNG, WebP 파일만 업로드할 수 있습니다.', 'error');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('파일 크기가 10MB를 초과합니다.', 'error');
        continue;
      }
      const url = URL.createObjectURL(file);
      const base64 = await blobToBase64(file);
      state.uploadedPhotos.push({ file, url, base64, mime: file.type });
      await dbPut(`uploadedPhoto_${state.uploadedPhotos.length - 1}`, file);
    }
    renderPhotoGrid();
  }

  function removePhoto(index) {
    const photo = state.uploadedPhotos[index];
    if (photo.url) URL.revokeObjectURL(photo.url);
    state.uploadedPhotos.splice(index, 1);
    savePhotosToDb();
    renderPhotoGrid();
  }

  function resetAllPhotos() {
    state.uploadedPhotos.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    state.uploadedPhotos = [];
    clearPhotosFromDb();
    renderPhotoGrid();
  }

  function renderPhotoGrid() {
    photoGrid.innerHTML = '';
    state.uploadedPhotos.forEach((photo, i) => {
      const item = document.createElement('div');
      item.className = 'photo-grid-item';
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = `업로드된 사진 ${i + 1}`;
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => removePhoto(i));
      item.appendChild(img);
      item.appendChild(deleteBtn);
      photoGrid.appendChild(item);
    });
    const hasPhotos = state.uploadedPhotos.length > 0;
    const isFull = state.uploadedPhotos.length >= MAX_PHOTOS;
    if (isFull) {
      dropZone.classList.add('hidden');
    } else {
      dropZone.classList.remove('hidden');
    }
    dropZone.classList.toggle('compact', hasPhotos && !isFull);
    uploadActions.classList.toggle('visible', hasPhotos);
  }

  async function savePhotosToDb() {
    for (let i = 0; i < MAX_PHOTOS; i++) {
      if (i < state.uploadedPhotos.length) {
        await dbPut(`uploadedPhoto_${i}`, state.uploadedPhotos[i].file);
      } else {
        await dbPut(`uploadedPhoto_${i}`, null);
      }
    }
  }

  async function clearPhotosFromDb() {
    for (let i = 0; i < MAX_PHOTOS; i++) {
      await dbPut(`uploadedPhoto_${i}`, null);
    }
  }
}

function renderStyleThumbs() {
  const container = document.getElementById('stylePhotoThumbs');
  container.innerHTML = '';
  state.uploadedPhotos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = `사진 ${i + 1}`;
    container.appendChild(img);
  });
}

// ===== Step 3: Style =====
function initStyle() {
  document.getElementById('backToUploadBtn').addEventListener('click', () => goToStep('upload'));
  const grid = document.getElementById('styleGrid');
  const customInput = document.getElementById('customPromptInput');
  const generateBtn = document.getElementById('generateBaseBtn');
  const tabPresets = document.getElementById('tabPresets');
  const tabCustom = document.getElementById('tabCustom');
  const tabs = document.querySelectorAll('.style-tab');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'presets') {
        tabPresets.classList.remove('hidden');
        tabCustom.classList.add('hidden');
      } else {
        tabPresets.classList.add('hidden');
        tabCustom.classList.remove('hidden');
      }

      if (target === 'custom') {
        // 직접 입력 모드: 프리셋 선택 해제, 커스텀으로 전환
        grid.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        state.selectedStyle = { id: 'custom', name: '직접 입력', prompt: '' };
        generateBtn.disabled = !customInput.value.trim();
      } else {
        // 프리셋 탭: 커스텀 해제, 선택된 프리셋이 있으면 활성
        state.selectedStyle = null;
        generateBtn.disabled = true;
      }
    });
  });

  function renderStyleCards() {
    grid.innerHTML = '';
    const allStyles = [...STYLE_PRESETS, ...aiSuggestedStyles];
    allStyles.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'style-card';
      if (preset.aiGenerated) card.classList.add('ai-suggested');
      card.dataset.styleId = preset.id;

      const emojiDiv = document.createElement('div');
      emojiDiv.className = 'emoji';
      emojiDiv.textContent = preset.emoji;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'info';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = preset.name;
      const descDiv = document.createElement('div');
      descDiv.className = 'description';
      descDiv.textContent = preset.description;
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(descDiv);

      card.appendChild(emojiDiv);
      card.appendChild(infoDiv);

      card.addEventListener('click', () => {
        grid.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedStyle = preset;
        trackEvent('style_select', { style_id: preset.id, style_name: preset.name });
        generateBtn.disabled = false;
      });
      grid.appendChild(card);
    });

    // "AI 테마 추천 더 받기" 카드 (항상 마지막)
    const moreCard = document.createElement('div');
    moreCard.className = 'style-card ai-more-card';
    moreCard.innerHTML = `
      <div class="emoji">✨</div>
      <div class="info">
        <div class="name">AI 테마 추천 더 받기</div>
        <div class="description">Gemini가 새로운 스타일을 제안합니다</div>
      </div>
    `;
    moreCard.addEventListener('click', () => fetchAiStyleSuggestions());
    grid.appendChild(moreCard);
  }

  renderStyleCards();

  customInput.addEventListener('input', () => {
    state.customPrompt = customInput.value;
    if (state.selectedStyle?.id === 'custom') {
      generateBtn.disabled = !customInput.value.trim();
    }
  });

  generateBtn.addEventListener('click', () => {
    if (!state.selectedStyle) return;
    generateBaseCharacter();
  });

  async function fetchAiStyleSuggestions() {
    if (!state.ai) return;
    const moreCard = grid.querySelector('.ai-more-card');
    if (!moreCard) return;
    const origHTML = moreCard.innerHTML;
    moreCard.innerHTML = `<div class="emoji animate-spin">⏳</div><div class="info"><div class="name">추천 생성 중...</div><div class="description">잠시만 기다려주세요</div></div>`;
    moreCard.classList.add('pointer-events-none');

    try {
      const resp = await state.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are a creative art director. Suggest 3 unique emoticon character styles that are different from these existing ones: 병맛 스케치, 지브리풍, 미니멀 라인, 귀여운 3D, 애니메이션.

Return ONLY a JSON array (no markdown, no code fence). Each element:
{"name": "한글 스타일명 (3-5글자)", "emoji": "대표 이모지 1개", "description": "한글 1줄 설명 (15자 이내)", "prompt": "English prompt for Gemini image generation describing this style in detail, including art technique, coloring, proportions"}

Be creative and diverse. Examples of good styles: 수묵화, 팝아트, 레트로 픽셀, 클레이 애니메이션, 수채화 동화풍, 네온 사이버펑크 등.`
      });

      let text = resp.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
      const suggestions = JSON.parse(text);

      suggestions.forEach((s, i) => {
        aiSuggestedStyles.push({
          id: `ai_${Date.now()}_${i}`,
          name: s.name,
          emoji: s.emoji,
          description: s.description,
          prompt: s.prompt,
          aiGenerated: true
        });
      });

      // 현재 선택 상태 보존
      const selectedId = state.selectedStyle?.id;
      renderStyleCards();
      if (selectedId) {
        const sel = grid.querySelector(`[data-style-id="${selectedId}"]`);
        if (sel) sel.classList.add('selected');
      }
      showToast(`${suggestions.length}개 새 스타일이 추가되었습니다`, 'success');
    } catch (e) {
      console.error('AI style suggestion failed:', e);
      moreCard.innerHTML = origHTML;
      moreCard.classList.remove('pointer-events-none');
      showToast('스타일 추천에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }
}

// ===== Step 4: Base Review =====
function initBaseReview() {
  document.getElementById('confirmBaseBtn').addEventListener('click', () => {
    state.characterName = document.getElementById('charNameInput').value.trim() || 'My Character';
    generateEmoticonList();
  });

  document.getElementById('regenerateBaseBtn').addEventListener('click', () => {
    generateBaseCharacter();
  });

  document.getElementById('changeStyleBtn').addEventListener('click', () => {
    goToStep('style');
  });
}

// ===== Gemini: Base Character =====
async function generateBaseCharacter() {
  goToStep('base_review');
  const skeleton = document.getElementById('baseSkeleton');
  const img = document.getElementById('baseImage');
  skeleton.classList.remove('hidden');
  skeleton.classList.add('flex');
  img.classList.add('hidden');
  img.classList.remove('block');

  let stylePrompt = state.selectedStyle.prompt;
  if (state.selectedStyle.id === 'custom') {
    stylePrompt = state.customPrompt || 'cute cartoon character style';
  }

  const photoCount = state.uploadedPhotos.length;
  const isRealistic = state.selectedStyle.isRealistic;
  const prompt = `I'm uploading ${photoCount} reference photo(s) of a real person. ${isRealistic ? 'Generate' : 'Create'} a single ${isRealistic ? 'stylized character' : 'character illustration'} that MUST closely resemble this specific person. Style: ${stylePrompt}.
This will be used as a base character for a set of 24 emoticons/stickers.
CRITICAL — Reference photo matching:
- You MUST carefully study ALL ${photoCount} attached reference photo(s)
- Use multiple angles/photos to build a more accurate representation of the person
- Preserve the person's EXACT distinguishing features: face shape, hairstyle, hair color, skin tone, glasses, facial hair, accessories, clothing style
- The character must be immediately recognizable as this specific person, not a generic character
- Even in minimal/abstract styles, the key visual identity of the person must be preserved
Rules:
- Create ONE character only, centered in the frame, full body visible
- White background
- The character should be expressive and suitable for various emotions
- Square 1:1 aspect ratio
${isRealistic ? '- Slightly oversized head with compact body proportions (vinyl toy ratio)' : '- Cute, round, and chibi-proportioned'}`;

  const parts = [{ text: prompt }];
  state.uploadedPhotos.forEach(photo => {
    parts.push({ inlineData: { mimeType: photo.mime, data: photo.base64 } });
  });

  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        showToast('이미지 재생성 중...', 'info');
        await delay(2000);
      }
      const response = await callGeminiWithRetry(async () => {
        return await state.ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        });
      });

      let imageFound = false;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const blob = base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
            state.baseCharacter = blob;
            state.baseCharacterBase64 = part.inlineData.data;
            if (state.baseCharacterUrl) URL.revokeObjectURL(state.baseCharacterUrl);
            state.baseCharacterUrl = URL.createObjectURL(blob);
            img.src = state.baseCharacterUrl;
            skeleton.classList.add('hidden');
            skeleton.classList.remove('flex');
            img.classList.remove('hidden');
            img.classList.add('block');
            await dbPut('baseCharacter', blob);
            imageFound = true;
            break;
          }
        }
      }
      if (!imageFound) {
        if (attempt < maxAttempts - 1) continue;
        throw new Error('AI가 이미지를 생성하지 못했습니다. 다른 사진이나 스타일을 시도해주세요.');
      }
      return; // 성공
    } catch (err) {
      if (attempt < maxAttempts - 1 && !err.message?.includes('다른 사진')) continue;
      skeleton.classList.add('hidden');
      skeleton.classList.remove('flex');
      handleApiError(err);
      goToStep('style');
      return;
    }
  }
}

// ===== Gemini: Emoticon List =====
async function generateEmoticonList() {
  goToStep('emoticon_list');
  const grid = document.getElementById('emoticonListGrid');
  const skelWrap = document.getElementById('listSkeleton');
  grid.innerHTML = '';
  skelWrap.classList.remove('hidden');
  skelWrap.classList.add('grid');
  skelWrap.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton skel-item';
    skelWrap.appendChild(s);
  }

  const prompt = `I'm showing you a base character image. Design 24 emoticon scenarios that would work perfectly for this specific character in real messaging conversations.

IMPORTANT: Study the character's visual style, proportions, and personality from the attached image. Each scenario should feel natural for THIS character.

Guidelines:
- ESSENTIAL emotions (8): greeting/hello, thank you, love, crying/sad, angry, surprised, laughing hard, thumbs up/approval
- DAILY LIFE situations (8): commuting to work, leaving work, eating, coffee, sleepy, exercising, checking phone, broke/no money
- COMMUNICATION expressions (8): sorry, congratulations, cheering/fighting, rejection/no, secret/shh, wait, excited, goodbye/bye

For each prompt:
- Describe DYNAMIC, EXAGGERATED poses and actions (not static standing poses)
- Include specific props, effects, and background elements that enhance the scene
- Use manga/comic-style action lines, sparkles, sweat drops, etc. for energy
- Each prompt should be vivid enough to generate a visually distinct emoticon
- First item must be greeting, last item must be goodbye

Return EXACTLY 24 items as JSON array only, no other text:
[{ "label": "한글 레이블 (2-5자)", "prompt": "detailed english action/pose/expression description with props and effects" }, ...]`;

  const parts = [{ text: prompt }];
  if (state.baseCharacterBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: state.baseCharacterBase64 } });
  }

  try {
    const response = await state.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts }]
    });

    let text = response.text || '';
    // Extract JSON from possible markdown code block
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const definitions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(definitions) && definitions.length >= 24) {
        state.emoticonDefinitions = definitions.slice(0, 24);
      } else {
        throw new Error('Insufficient items');
      }
    } else {
      throw new Error('No JSON found');
    }
  } catch (err) {
    console.warn('Emoticon list generation failed, using fallback:', err);
    state.emoticonDefinitions = FALLBACK_DEFINITIONS;
  }

  skelWrap.classList.add('hidden');
  skelWrap.classList.remove('grid');
  renderEmoticonList();
}

function renderEmoticonList() {
  const grid = document.getElementById('emoticonListGrid');
  grid.innerHTML = '';
  state.emoticonDefinitions.forEach((def, i) => {
    const item = document.createElement('div');
    item.className = 'emoticon-list-item';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = String(i + 1).padStart(2, '0');

    const content = document.createElement('div');
    content.className = 'content';
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = def.label;
    const promptDesc = document.createElement('div');
    promptDesc.className = 'prompt-desc';
    promptDesc.textContent = def.prompt;

    // 편집 필드
    const editFields = document.createElement('div');
    editFields.className = 'edit-fields';
    editFields.innerHTML = `
      <input type="text" class="edit-label" value="${def.label.replace(/"/g, '&quot;')}" placeholder="한글 레이블">
      <textarea class="edit-prompt" placeholder="영문 포즈/표정 설명">${def.prompt}</textarea>
      <div class="edit-actions">
        <button class="cancel-btn" type="button">취소</button>
        <button class="save-btn" type="button">저장</button>
      </div>
    `;

    content.appendChild(label);
    content.appendChild(promptDesc);
    content.appendChild(editFields);

    // 편집 버튼
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '\u270F\uFE0F';
    editBtn.title = '수정';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 다른 편집 중인 항목 닫기
      grid.querySelectorAll('.emoticon-list-item.editing').forEach(el => el.classList.remove('editing'));
      item.classList.add('editing');
      editFields.querySelector('.edit-label').focus();
    });

    // 저장
    editFields.querySelector('.save-btn').addEventListener('click', () => {
      const newLabel = editFields.querySelector('.edit-label').value.trim();
      const newPrompt = editFields.querySelector('.edit-prompt').value.trim();
      if (newLabel) state.emoticonDefinitions[i].label = newLabel;
      if (newPrompt) state.emoticonDefinitions[i].prompt = newPrompt;
      label.textContent = state.emoticonDefinitions[i].label;
      promptDesc.textContent = state.emoticonDefinitions[i].prompt;
      item.classList.remove('editing');
    });

    // 취소
    editFields.querySelector('.cancel-btn').addEventListener('click', () => {
      editFields.querySelector('.edit-label').value = def.label;
      editFields.querySelector('.edit-prompt').value = def.prompt;
      item.classList.remove('editing');
    });

    item.appendChild(num);
    item.appendChild(content);
    item.appendChild(editBtn);
    grid.appendChild(item);
  });
}

function initEmoticonList() {
  document.getElementById('confirmListBtn').addEventListener('click', () => {
    startGeneration();
  });
  document.getElementById('backToBaseBtn').addEventListener('click', () => goToStep('base_review'));
}

// ===== Step 6: Generation =====

// 단일 시트 생성 함수: 생성 → 분할 → 완료
async function generateSingleSheet(sheetIdx, styleDesc, completedRef) {
  const startEmo = sheetIdx * 6;
  const defs = state.emoticonDefinitions.slice(startEmo, startEmo + 6);
  const defsText = defs.map((d, i) => `${startEmo + i + 1}. ${d.label}: ${d.prompt}`).join('\n');

    const isRealisticStyle = state.selectedStyle?.isRealistic;
    const sheetPrompt = `I am attaching a reference character image. You MUST ${isRealisticStyle ? 'render' : 'draw'} THE EXACT SAME CHARACTER in 6 different poses.

CHARACTER IDENTITY (MUST MATCH EXACTLY):
- Copy the EXACT same character from the attached reference image
- Same species (if animal, keep it as that animal — do NOT change to human or different animal)
- Same face shape, body proportions, colors, and markings
- Same clothing, accessories, and distinctive features
- If the reference shows a cat, ALL 6 poses must be that same cat. If it shows a person, ALL 6 must be that same person.

LAYOUT: 3-column x 2-row grid, pure white background, NO grid lines/borders/dividers.

The 6 emoticon poses (left to right, top to bottom):
${defsText}

RULES:
- EXACTLY 6 characters, one per cell. Each is the SAME character in a different pose.
- Each pose/expression must be clearly different and exaggerated.
- Full body, centered in each cell with generous padding.
- ABSOLUTELY NO TEXT anywhere in the image. No numbers, no labels, no titles, no words in any language. The image must contain ONLY ${isRealisticStyle ? 'renders' : 'illustrations'} with zero text/typography.
- Style: ${styleDesc}`;

  const generateOnce = async () => {
    const response = await callGeminiWithRetry(async () => {
      return await state.ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{
          role: 'user',
          parts: [
            { text: sheetPrompt },
            { inlineData: { mimeType: 'image/png', data: state.baseCharacterBase64 } }
          ]
        }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '3:2', imageSize: '2K' }
        }
      });
    });

    let sheetBlob = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          sheetBlob = base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
          break;
        }
      }
    }
    if (!sheetBlob) throw new Error('No image in response');
    return sheetBlob;
  };

  // 썸네일 상태 업데이트 헬퍼
  const setThumbStatus = (status, blob) => {
    const thumb = document.getElementById(`sheetThumb${sheetIdx}`);
    const retryBtn = document.getElementById(`sheetRetry${sheetIdx}`);
    if (status === 'generating') {
      thumb.textContent = `${sheetIdx + 1}`;
      thumb.className = 'sheet-thumb';
      if (retryBtn) retryBtn.classList.add('hidden');
    } else if (status === 'done') {
      thumb.innerHTML = '';
      thumb.className = 'sheet-thumb done';
      if (blob) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        thumb.appendChild(img);
      }
      // 시트 클릭 시 모달로 크게 보기
      thumb.onclick = () => openSheetModal(sheetIdx);
      if (retryBtn) retryBtn.classList.remove('hidden');
    } else if (status === 'error') {
      thumb.innerHTML = '';
      thumb.textContent = '!';
      thumb.className = 'sheet-thumb sheet-error';
      if (retryBtn) retryBtn.classList.add('hidden');
    }
  };

  try {
    // 1. 시트 이미지 생성
    setThumbStatus('generating');
    const sheetBlob = await generateOnce();

    // 2. 성공 처리
    state.sheets[sheetIdx] = sheetBlob;
    await dbPut(`sheet_${sheetIdx}`, sheetBlob);
    setThumbStatus('done', sheetBlob);

    // 5. 시트 분할
    const emoticons = await splitSheet(sheetBlob, startEmo);
    for (const emo of emoticons) {
      state.emoticons[emo.index] = emo;
      await dbPut(`emoticon_${emo.index}`, emo.blob);
    }

    // 6. progress 업데이트
    completedRef.count++;
    updateProgress(completedRef.count, 4, completedRef.count < 4 ? `${completedRef.count}/4 시트 완료...` : '완료!');

    return { status: 'fulfilled', sheetIdx };
  } catch (err) {
    console.error(`Sheet ${sheetIdx} failed:`, err);
    state.failedSheets.push(sheetIdx);
    setThumbStatus('error');
    showToast(`시트 ${sheetIdx + 1} 생성 실패`, 'error');
    return { status: 'rejected', sheetIdx, reason: err };
  }
}

// ===== 시트 모달 보기 =====
let currentSheetModalIndex = 0;
let sheetModalMode = false;

function openSheetModal(sheetIdx) {
  currentSheetModalIndex = sheetIdx;
  sheetModalMode = true;
  // 시트 모달은 더 크게 표시
  const content = document.querySelector('.modal-content');
  const img = document.getElementById('modalImage');
  content.classList.add('!max-w-[600px]');
  img.classList.add('!w-full', '!h-auto');
  img.classList.remove('w-60', 'h-60');
  updateSheetModalContent();
  document.getElementById('modalOverlay').classList.add('open');
}

function updateSheetModalContent() {
  const sheetBlob = state.sheets[currentSheetModalIndex];
  if (!sheetBlob) return;
  const modalImage = document.getElementById('modalImage');
  modalImage.src = URL.createObjectURL(sheetBlob);
  document.getElementById('modalLabel').textContent = `시트 ${currentSheetModalIndex + 1}`;
  const startEmo = currentSheetModalIndex * 6 + 1;
  const endEmo = startEmo + 5;
  document.getElementById('modalNum').textContent = `이모티콘 ${startEmo}~${endEmo}`;

  // 모달 재생성 버튼 표시
  let sheetRetryModal = document.getElementById('modalSheetRetryBtn');
  if (!sheetRetryModal) {
    sheetRetryModal = document.createElement('button');
    sheetRetryModal.id = 'modalSheetRetryBtn';
    sheetRetryModal.className = 'modal-sheet-retry-btn';
    sheetRetryModal.textContent = '\u21BB 이 시트 재생성';
    sheetRetryModal.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
      regenerateSingleSheet(currentSheetModalIndex);
    });
    document.querySelector('.modal-content').appendChild(sheetRetryModal);
  }
  sheetRetryModal.classList.remove('hidden');
}

// ===== 개별 시트 재생성 =====
async function regenerateSingleSheet(sheetIdx) {
  let styleDesc = state.selectedStyle?.prompt || 'cute cartoon character';
  if (state.selectedStyle?.id === 'custom') {
    styleDesc = state.customPrompt || 'cute cartoon character';
  }
  const dummyRef = { count: 0 };
  await generateSingleSheet(sheetIdx, styleDesc, dummyRef);

  // 완성 페이지가 표시된 상태라면 해당 이모티콘 카드도 업데이트
  if (state.currentStep === 'complete') {
    const startEmo = sheetIdx * 6;
    for (let i = startEmo; i < startEmo + 6; i++) {
      const emo = state.emoticons[i];
      if (!emo || !emo.blob) continue;
      const card = document.querySelector(`.emoticon-card[data-index="${i}"]`);
      if (card) {
        const img = card.querySelector('img');
        if (img) img.src = URL.createObjectURL(emo.blob);
      }
    }
  }
}

async function startGeneration() {
  goToStep('generating');
  state.sheets = [];
  state.emoticons = [];
  state.failedSheets = [];
  state.setId = Date.now().toString();

  const strip = document.getElementById('sheetStrip');
  strip.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sheet-thumb-wrapper';
    const thumb = document.createElement('div');
    thumb.className = 'sheet-thumb';
    thumb.id = `sheetThumb${i}`;
    thumb.textContent = `${i + 1}`;
    const retryBtn = document.createElement('button');
    retryBtn.className = 'sheet-retry-btn hidden';
    retryBtn.id = `sheetRetry${i}`;
    retryBtn.dataset.sheet = i;
    retryBtn.textContent = '\u21BB';
    retryBtn.title = '이 시트 재생성';
    retryBtn.addEventListener('click', () => regenerateSingleSheet(i));
    wrapper.appendChild(thumb);
    wrapper.appendChild(retryBtn);
    strip.appendChild(wrapper);
  }

  updateProgress(0, 4, '준비 중...');

  // Build character description for consistent generation
  let styleDesc = state.selectedStyle.prompt;
  if (state.selectedStyle.id === 'custom') {
    styleDesc = state.customPrompt || 'cute cartoon character';
  }

  // 완료 카운터 (병렬 실행 시 atomic 증가를 위한 공유 참조)
  const completedRef = { count: 0 };

  // 배치 1: 시트 0, 1 병렬 생성
  updateProgress(0, 4, '시트 1~2 생성 중...');
  await Promise.allSettled([
    generateSingleSheet(0, styleDesc, completedRef),
    generateSingleSheet(1, styleDesc, completedRef)
  ]);

  // 배치 2: 시트 2, 3 병렬 생성 (rate limit 고려하여 약간 대기)
  await delay(2000);
  updateProgress(completedRef.count, 4, '시트 3~4 생성 중...');
  await Promise.allSettled([
    generateSingleSheet(2, styleDesc, completedRef),
    generateSingleSheet(3, styleDesc, completedRef)
  ]);

  // 결과 취합
  if (state.failedSheets.length > 0) {
    document.getElementById('retrySheetBtn').classList.remove('hidden');
    document.getElementById('progressDetail').textContent = `${4 - state.failedSheets.length}/4 시트 완성. 실패한 시트를 재시도해주세요.`;
  }

  // 생성 완료 — 이전/다음 버튼 표시 (자동 이동하지 않음)
  if (state.failedSheets.length === 0) {
    await generateSpecialImages();
    document.getElementById('progressDetail').textContent = '모든 시트가 완성되었습니다!';
  }
  document.getElementById('generatingNav').classList.remove('hidden');
}

function initGenerating() {
  document.getElementById('retrySheetBtn').addEventListener('click', async () => {
    document.getElementById('retrySheetBtn').classList.add('hidden');
    showToast('실패한 시트를 재생성합니다...', 'info');
    await startGeneration();
  });
  document.getElementById('backToListBtn').addEventListener('click', () => {
    document.getElementById('generatingNav').classList.add('hidden');
    goToStep('emoticon_list');
  });
  document.getElementById('goToCompleteBtn').addEventListener('click', () => {
    document.getElementById('generatingNav').classList.add('hidden');
    showComplete();
  });
}

function updateProgress(current, total, text) {
  document.getElementById('progressNum').textContent = `${current}/${total}`;
  document.getElementById('progressSub').textContent = text;
  document.getElementById('progressDetail').textContent = text;
  const circle = document.getElementById('progressCircle');
  const circumference = 2 * Math.PI * 72;
  const offset = circumference - (current / total) * circumference;
  circle.style.strokeDashoffset = offset;
}

// ===== Canvas: Sheet Splitting =====
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

      // Draw cell content with small margin to avoid grid lines
      const margin = Math.max(3, cellW * 0.01);
      ctx.drawImage(img,
        col * cellW + margin, row * cellH + margin,
        cellW - margin * 2, cellH - margin * 2,
        0, 0, 360, 360
      );

      // White to transparent
      removeWhiteBackground(ctx, 360, 360);

      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const index = startIndex + row * 3 + col;
      results.push({
        index,
        blob,
        label: state.emoticonDefinitions[index]?.label || `#${index + 1}`
      });
    }
  }
  return results;
}

function removeWhiteBackground(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= 235 && g >= 235 && b >= 235) {
      data[i + 3] = 0;
    } else if (r >= 215 && g >= 215 && b >= 215) {
      // Edge smoothing: gradual alpha for near-white pixels
      const whiteness = Math.min(r, g, b);
      const alpha = Math.round(255 * (1 - (whiteness - 215) / 40));
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// ===== Special Images =====
async function generateSpecialImages() {
  if (!state.emoticons[0] || !state.emoticons[0].blob) return;

  // Main image 240x240
  const mainCanvas = new OffscreenCanvas(240, 240);
  const mainCtx = mainCanvas.getContext('2d');
  const mainBitmap = await createImageBitmap(state.emoticons[0].blob);
  mainCtx.drawImage(mainBitmap, 0, 0, 240, 240);
  state.mainImage = await mainCanvas.convertToBlob({ type: 'image/png' });
  await dbPut('mainImage', state.mainImage);

}

// ===== Step 7: Complete =====
function showComplete() {
  goToStep('complete');

  const avatar = document.getElementById('completeAvatar');
  avatar.src = state.baseCharacterUrl;
  const nameEl = document.getElementById('completeCharName');
  nameEl.textContent = state.characterName;

  // Special images
  const specialContainer = document.getElementById('specialImages');
  specialContainer.innerHTML = '';
  if (state.mainImage) {
    const mainItem = document.createElement('div');
    mainItem.className = 'special-item';
    const mainImg = document.createElement('img');
    mainImg.src = URL.createObjectURL(state.mainImage);
    mainImg.width = 120;
    mainImg.alt = '메인 이미지';
    const mainLabel = document.createElement('div');
    mainLabel.className = 'label-text';
    mainLabel.textContent = '메인 240\u00D7240';
    mainItem.appendChild(mainImg);
    mainItem.appendChild(mainLabel);
    specialContainer.appendChild(mainItem);
  }

  // Emoticon grid
  const grid = document.getElementById('emoticonGrid');
  grid.innerHTML = '';
  state.emoticons.forEach((emo, i) => {
    if (!emo || !emo.blob) return;
    const card = document.createElement('div');
    card.className = 'emoticon-card';
    card.dataset.index = i;

    const numDiv = document.createElement('div');
    numDiv.className = 'card-num';
    numDiv.textContent = String(i + 1).padStart(2, '0');

    const img = document.createElement('img');
    img.src = URL.createObjectURL(emo.blob);
    img.alt = emo.label;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'card-label';
    labelDiv.textContent = emo.label;

    card.appendChild(numDiv);
    card.appendChild(img);
    card.appendChild(labelDiv);

    card.addEventListener('click', () => openModal(i));
    grid.appendChild(card);
  });
}

// ===== Modal =====
let currentModalIndex = 0;

function openModal(index) {
  currentModalIndex = index;
  updateModalContent();
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  // 시트 모달 크기 복원
  if (sheetModalMode) {
    const content = document.querySelector('.modal-content');
    const img = document.getElementById('modalImage');
    content.classList.remove('!max-w-[600px]');
    img.classList.remove('!w-full', '!h-auto');
    img.classList.add('w-60', 'h-60');
  }
  sheetModalMode = false;
  const sheetRetryModal = document.getElementById('modalSheetRetryBtn');
  if (sheetRetryModal) sheetRetryModal.classList.add('hidden');
}

function updateModalContent() {
  const emo = state.emoticons[currentModalIndex];
  if (!emo) return;
  document.getElementById('modalImage').src = URL.createObjectURL(emo.blob);
  document.getElementById('modalLabel').textContent = emo.label;
  document.getElementById('modalNum').textContent = `${currentModalIndex + 1} / 24`;
}

function navigateModal(direction) {
  if (sheetModalMode) {
    currentSheetModalIndex = (currentSheetModalIndex + direction + 4) % 4;
    updateSheetModalContent();
  } else {
    currentModalIndex = (currentModalIndex + direction + 24) % 24;
    updateModalContent();
  }
}

function initModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModal(-1);
  });
  document.getElementById('modalNext').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModal(1);
  });
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('modalOverlay').classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });
}

// ===== ZIP Download =====
function initDownload() {
  document.getElementById('downloadZipBtn').addEventListener('click', async () => {
    const btn = document.getElementById('downloadZipBtn');
    btn.disabled = true;
    btn.textContent = '압축 중...';
    try {
      const zip = new JSZip();
      if (state.mainImage) zip.file('main.png', state.mainImage);
      state.emoticons.forEach((emo, i) => {
        if (emo && emo.blob) {
          zip.file(`${String(i + 1).padStart(2, '0')}.png`, emo.blob);
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const safeName = state.characterName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_') || 'emoticons';
      saveAs(blob, `${safeName}_emoticons.zip`);
      trackEvent('download_zip', { character_name: state.characterName });
      showToast('다운로드가 시작되었습니다!', 'success');
    } catch (err) {
      showToast('ZIP 생성에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '&#128230; 전체 다운로드 (ZIP)';
    }
  });

  document.getElementById('newSetBtn').addEventListener('click', async () => {
    await dbClear();
    state.sheets = [];
    state.emoticons = [];
    state.mainImage = null;
    state.baseCharacter = null;
    state.baseCharacterUrl = null;
    state.baseCharacterBase64 = null;
    state.emoticonDefinitions = [];
    state.failedSheets = [];
    state.selectedStyle = null;
    state.uploadedPhotos.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    state.uploadedPhotos = [];
    state.characterName = 'My Character';
    document.getElementById('charNameInput').value = 'My Character';
    document.getElementById('photoGrid').innerHTML = '';
    document.getElementById('uploadActions').classList.remove('visible');
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('dropZone').classList.remove('compact');
    document.getElementById('fileInput').value = '';
    document.getElementById('baseImage').classList.add('hidden');
    document.getElementById('baseImage').classList.remove('block');
    document.getElementById('baseSkeleton').classList.add('hidden');
    document.getElementById('baseSkeleton').classList.remove('flex');
    document.getElementById('emoticonListGrid').innerHTML = '';
    document.getElementById('emoticonGrid').innerHTML = '';
    document.getElementById('specialImages').innerHTML = '';
    document.getElementById('sheetStrip').innerHTML = '';
    document.getElementById('styleGrid').querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.style-tab').forEach((t, i) => { t.classList.toggle('active', i === 0); });
    document.getElementById('tabPresets').classList.remove('hidden');
    document.getElementById('tabCustom').classList.add('hidden');
    document.getElementById('customPromptInput').value = '';
    document.getElementById('generateBaseBtn').disabled = true;
    aiSuggestedStyles = [];
    goToStep('upload');
  });
}

// ===== API Error Handling =====
function handleApiError(err) {
  const msg = err.message || err.toString();
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    showToast('API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'error');
  } else if (msg.includes('400') || msg.includes('SAFETY') || msg.includes('blocked')) {
    showToast('이미지 생성이 차단되었습니다. 다른 사진이나 스타일을 시도해주세요.', 'error');
  } else if (msg.includes('500') || msg.includes('INTERNAL')) {
    showToast('Gemini 서버 오류입니다. 잠시 후 다시 시도해주세요.', 'error');
  } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
    showToast('인터넷 연결을 확인해주세요.', 'error');
  } else {
    showToast(`이미지 생성에 실패했습니다: ${msg}`, 'error');
  }
}

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

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ===== IndexedDB Restore =====
async function tryRestore() {
  try {
    const baseBlob = await dbGet('baseCharacter');
    const mainBlob = await dbGet('mainImage');
    if (!mainBlob) return false;

    // Restore emoticons
    const emoticons = [];
    let allFound = true;
    for (let i = 0; i < 24; i++) {
      const blob = await dbGet(`emoticon_${i}`);
      if (blob) {
        emoticons.push({ index: i, blob, label: '' });
      } else {
        allFound = false;
      }
    }
    if (!allFound || emoticons.length < 24) return false;

    state.emoticons = emoticons;
    state.mainImage = mainBlob;
    if (baseBlob) {
      state.baseCharacter = baseBlob;
      state.baseCharacterUrl = URL.createObjectURL(baseBlob);
    }
    // Restore uploaded photos
    for (let i = 0; i < MAX_PHOTOS; i++) {
      const photoBlob = await dbGet(`uploadedPhoto_${i}`);
      if (photoBlob) {
        const url = URL.createObjectURL(photoBlob);
        const base64 = await blobToBase64(photoBlob);
        state.uploadedPhotos.push({ file: photoBlob, url, base64, mime: photoBlob.type || 'image/png' });
      }
    }
    state.emoticonDefinitions = FALLBACK_DEFINITIONS; // Labels for restored set
    emoticons.forEach((emo, i) => {
      emo.label = FALLBACK_DEFINITIONS[i]?.label || `#${i + 1}`;
    });

    showComplete();
    return true;
  } catch (e) {
    return false;
  }
}

// ===== Init =====
async function init() {
  // 동적으로 @google/genai 로드 (file:// 프로토콜 지원)
  try {
    const module = await import('https://esm.sh/@google/genai');
    GoogleGenAI = module.GoogleGenAI;
  } catch (e) {
    console.error('Google GenAI SDK 로드 실패:', e);
  }

  try { await openDB(); } catch (e) { console.warn('IndexedDB unavailable'); }

  renderStepIndicator();

  // 로고 클릭 시 처음으로 이동 (API 키 있으면 업로드 단계, 없으면 키 입력 단계)
  document.querySelector('.logo').addEventListener('click', () => {
    goToStep(state.apiKey ? 'upload' : 'api_key');
  });

  initApiKey();
  initUpload();
  initStyle();
  initBaseReview();
  initEmoticonList();
  initGenerating();
  initModal();
  initDownload();

  // Try restore from IndexedDB
  if (state.apiKey) {
    const restored = await tryRestore();
    if (restored) return;
  }

  if (!state.apiKey) {
    goToStep('api_key');
  }
}

init();
