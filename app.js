/**
 * Emoticon Maker - AI 이모티콘 생성
 * Copyright (c) 2026 Hwang Minho (revfactory@gmail.com)
 * Licensed under Apache 2.0 + Commons Clause — 상업적 판매 불가
 * See LICENSE file for details
 */

import { GoogleGenAI } from '@google/genai';

// ===== Constants =====
const STEPS = ['api_key', 'upload', 'style', 'base_review', 'emoticon_list', 'generating', 'complete'];
const STYLE_PRESETS = [
  { id: 'byungmat', name: '병맛 스케치', emoji: '🎨', description: '대충 그린 듯한 뀨여운 병맛 캐릭터', prompt: 'Create a funny crude sketch style character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) in an intentionally messy and cute doodle style with exaggerated expressions, simple colored pencil look' },
  { id: 'ghibli', name: '지브리풍', emoji: '🌸', description: '미야자키 스타일 수채화 감성', prompt: 'Create a Studio Ghibli / Miyazaki style watercolor character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with soft pastel colors, gentle warm lighting, hand-painted aesthetic with delicate details' },
  { id: 'minimal', name: '미니멀 라인', emoji: '✏️', description: '심플한 선화, 최소 디테일', prompt: 'Create a minimal line art character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with clean simple black outlines, very few details, flat colors, modern minimalist illustration style' },
  { id: 'cute3d', name: '귀여운 3D', emoji: '🧸', description: '쫀득쫀득 마시멜로 3D 캐릭터', prompt: 'Create a cute squishy 3D marshmallow character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with soft round shapes, clay-like texture, pastel colors, adorable chibi proportions, 3D rendered look' },
  { id: 'anime', name: '애니메이션', emoji: '🎌', description: '일본 애니메이션 스타일 SD 캐릭터', prompt: 'Create a Japanese anime style super-deformed (SD/chibi) character based on the reference photo, capturing the person\'s distinctive features (hairstyle, face shape, glasses, accessories) with big expressive eyes, colorful, typical anime cel-shading style' }
];
let aiSuggestedStyles = [];

const FALLBACK_DEFINITIONS = [
  { label: '인사/안녕', prompt: 'waving hello with a big cheerful smile, one hand raised high' },
  { label: '고마워', prompt: 'bowing deeply with sparkling grateful tears' },
  { label: '사랑해', prompt: 'heart-shaped eyes, hugging a big red heart' },
  { label: '울음', prompt: 'sitting on ground crying dramatically, rivers of tears' },
  { label: '화남', prompt: 'bright red face, steam shooting from ears, fists clenched' },
  { label: '놀람', prompt: 'jaw dropping to floor, eyes popping out on springs' },
  { label: 'ㅋㅋㅋ', prompt: 'rolling on floor laughing, tears of joy flying' },
  { label: '좋아요', prompt: 'enthusiastic double thumbs up, sparkling eyes' },
  { label: '미안', prompt: 'on knees with puppy dog eyes, hands clasped begging' },
  { label: '축하', prompt: 'wearing party hat, throwing confetti, excited face' },
  { label: '피곤', prompt: 'dark circles, soul leaving body as ghost' },
  { label: '싫어', prompt: 'crossing arms in X shape, disgusted face' },
  { label: '출근', prompt: 'dragging feet like zombie, briefcase in hand' },
  { label: '퇴근', prompt: 'sprinting with cape flying, pure joy expression' },
  { label: '밥먹자', prompt: 'drooling over steaming bowl of rice' },
  { label: '커피', prompt: 'hugging giant coffee cup lovingly, hearts floating' },
  { label: '잠와', prompt: 'sleeping with huge snot bubble, ZZZ floating' },
  { label: '운동', prompt: 'lifting tiny dumbbells with noodle arms, sweating' },
  { label: '공부', prompt: 'brain exploding, surrounded by stacks of books' },
  { label: '쉿', prompt: 'finger on lips, shifty suspicious eyes' },
  { label: '쇼핑', prompt: 'eyes as dollar signs, surrounded by shopping bags' },
  { label: '잠깐', prompt: 'hand up in stop gesture, stern waiting face' },
  { label: '파이팅', prompt: 'cheerleading with pom-poms, fired up face' },
  { label: '바이바이', prompt: 'waving goodbye dramatically, single tear rolling' }
];

// ===== App State =====
const state = {
  currentStep: 'api_key',
  apiKey: null,
  ai: null,
  uploadedPhoto: null,
  uploadedPhotoUrl: null,
  uploadedPhotoBase64: null,
  uploadedPhotoMime: null,
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
  tabImage: null,
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
      await ai.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: 'Hi' });
      state.apiKey = key;
      state.ai = ai;
      sessionStorage.setItem('gemini_api_key', key);
      successEl.style.display = 'flex';
      document.getElementById('keyStatus').style.display = 'flex';
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
    document.getElementById('keyStatus').style.display = 'none';
    input.value = '';
    successEl.style.display = 'none';
    goToStep('api_key');
  });

  // Restore session
  const savedKey = sessionStorage.getItem('gemini_api_key');
  if (savedKey) {
    state.apiKey = savedKey;
    state.ai = new GoogleGenAI({ apiKey: savedKey });
    document.getElementById('keyStatus').style.display = 'flex';
    document.getElementById('keyMask').textContent = maskKey(savedKey);
    goToStep('upload');
  }
}

// ===== Step 2: Upload =====
function initUpload() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  document.getElementById('reUploadBtn').addEventListener('click', () => {
    resetUpload();
    fileInput.click();
  });

  document.getElementById('toStyleBtn').addEventListener('click', () => {
    if (state.uploadedPhoto) {
      document.getElementById('stylePhotoThumb').src = state.uploadedPhotoUrl;
      goToStep('style');
    }
  });

  async function handleFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('JPG, PNG, WebP 파일만 업로드할 수 있습니다.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('파일 크기가 10MB를 초과합니다.', 'error');
      return;
    }
    state.uploadedPhoto = file;
    state.uploadedPhotoMime = file.type;
    if (state.uploadedPhotoUrl) URL.revokeObjectURL(state.uploadedPhotoUrl);
    state.uploadedPhotoUrl = URL.createObjectURL(file);
    state.uploadedPhotoBase64 = await blobToBase64(file);
    previewImg.src = state.uploadedPhotoUrl;
    dropZone.style.display = 'none';
    preview.style.display = 'block';
    await dbPut('uploadedPhoto', file);
  }

  function resetUpload() {
    dropZone.style.display = 'flex';
    preview.style.display = 'none';
    fileInput.value = '';
  }
}

// ===== Step 3: Style =====
function initStyle() {
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
      tabPresets.style.display = target === 'presets' ? '' : 'none';
      tabCustom.style.display = target === 'custom' ? '' : 'none';

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
    moreCard.innerHTML = `<div class="emoji" style="animation:spin 1s linear infinite">⏳</div><div class="info"><div class="name">추천 생성 중...</div><div class="description">잠시만 기다려주세요</div></div>`;
    moreCard.style.pointerEvents = 'none';

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
      moreCard.style.pointerEvents = '';
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
  skeleton.style.display = 'flex';
  img.style.display = 'none';

  let stylePrompt = state.selectedStyle.prompt;
  if (state.selectedStyle.id === 'custom') {
    stylePrompt = state.customPrompt || 'cute cartoon character style';
  }

  const prompt = `I'm uploading a reference photo of a real person. Create a single character illustration that MUST closely resemble this specific person. Style: ${stylePrompt}.
This will be used as a base character for a set of 24 emoticons/stickers.
CRITICAL — Reference photo matching:
- You MUST carefully study the attached reference photo first
- Preserve the person's EXACT distinguishing features: face shape, hairstyle, hair color, skin tone, glasses, facial hair, accessories, clothing style
- The character must be immediately recognizable as this specific person, not a generic character
- Even in minimal/abstract styles, the key visual identity of the person must be preserved
Rules:
- Create ONE character only, centered in the frame, full body visible
- White background
- The character should be expressive and suitable for various emotions
- Square 1:1 aspect ratio
- Cute, round, and chibi-proportioned`;

  try {
    const response = await state.ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: state.uploadedPhotoMime, data: state.uploadedPhotoBase64 } }
        ]
      }],
      config: {
        responseModalities: ['TEXT', 'IMAGE']
      }
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
          skeleton.style.display = 'none';
          img.style.display = 'block';
          await dbPut('baseCharacter', blob);
          imageFound = true;
          break;
        }
      }
    }
    if (!imageFound) {
      throw new Error('이미지가 응답에 포함되지 않았습니다.');
    }
  } catch (err) {
    skeleton.style.display = 'none';
    handleApiError(err);
    goToStep('style');
  }
}

// ===== Gemini: Emoticon List =====
async function generateEmoticonList() {
  goToStep('emoticon_list');
  const grid = document.getElementById('emoticonListGrid');
  const skelWrap = document.getElementById('listSkeleton');
  grid.innerHTML = '';
  skelWrap.style.display = 'grid';
  skelWrap.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton skel-item';
    skelWrap.appendChild(s);
  }

  const prompt = `이 캐릭터로 카카오 이모티콘 24종을 만들려고 합니다.
다양한 감정과 일상 상황을 커버하는 24개 이모티콘 목록을 만들어주세요.

가이드라인:
- 필수 카테고리: 인사(1), 감사(1), 사랑(1~2), 슬픔/울음(1), 화남(1), 놀람(1), 웃음(1~2), 긍정(1~2)
- 일상 상황: 출퇴근, 식사, 커피, 수면, 운동, 공부, 쇼핑 등에서 6~8개
- 소통 표현: 미안, 축하, 응원, 거절, 비밀, 기다려 등에서 4~6개
- 인사/작별은 반드시 포함 (첫 번째, 마지막)
- 각 prompt는 캐릭터의 구체적 포즈/표정/소품을 포함하는 영문 1~2문장
- 매번 새로운 조합과 표현으로 다양성 확보

정확히 24개 항목을 JSON 배열로 반환하세요. 다른 텍스트 없이 JSON만:
[{ "label": "한글 레이블", "prompt": "english pose/expression description" }, ...]`;

  try {
    const response = await state.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt
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

  skelWrap.style.display = 'none';
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
}

// ===== Step 6: Generation =====
async function startGeneration() {
  goToStep('generating');
  state.sheets = [];
  state.emoticons = [];
  state.failedSheets = [];
  state.setId = Date.now().toString();

  const strip = document.getElementById('sheetStrip');
  strip.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const thumb = document.createElement('div');
    thumb.className = 'sheet-thumb';
    thumb.id = `sheetThumb${i}`;
    thumb.textContent = `${i + 1}`;
    strip.appendChild(thumb);
  }

  updateProgress(0, 4, '준비 중...');

  // Build character description for consistent generation
  let styleDesc = state.selectedStyle.prompt;
  if (state.selectedStyle.id === 'custom') {
    styleDesc = state.customPrompt || 'cute cartoon character';
  }

  for (let sheetIdx = 0; sheetIdx < 4; sheetIdx++) {
    const startEmo = sheetIdx * 6;
    const defs = state.emoticonDefinitions.slice(startEmo, startEmo + 6);
    const defsText = defs.map((d, i) => `${startEmo + i + 1}. ${d.label}: ${d.prompt}`).join('\n');

    const sheetPrompt = `Using the reference character image, draw EXACTLY 6 emoticon poses arranged in a 3-column x 2-row grid on a pure white background.

The 6 emoticons (left to right, top to bottom):
${defsText}

CRITICAL RULES:
- Draw EXACTLY 6 characters total. NOT more, NOT less. One character per grid cell.
- 3 columns x 2 rows. Each cell is the same size.
- Pure white background everywhere. NO grid lines, NO borders, NO dividers, NO separators between cells.
- The characters are separated only by white space — no drawn lines or borders.
- Keep the character consistent: same style, proportions, and outfit as the reference image.
- Each pose/expression must be clearly different and exaggerated.
- Full body character centered in each cell with generous padding.
- Do NOT add any text, labels, or Korean/English words inside the image.
- Style: ${styleDesc}`;

    try {
      if (sheetIdx > 0) await delay(2000);
      updateProgress(sheetIdx, 4, `시트 ${sheetIdx + 1} 생성 중... (이모티콘 ${startEmo + 1}~${startEmo + 6})`);

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

      state.sheets[sheetIdx] = sheetBlob;
      await dbPut(`sheet_${sheetIdx}`, sheetBlob);

      // Show sheet thumbnail
      const thumb = document.getElementById(`sheetThumb${sheetIdx}`);
      thumb.innerHTML = '';
      thumb.classList.add('done');
      const thumbImg = document.createElement('img');
      thumbImg.src = URL.createObjectURL(sheetBlob);
      thumb.appendChild(thumbImg);

      // Split sheet
      const emoticons = await splitSheet(sheetBlob, startEmo);
      for (const emo of emoticons) {
        state.emoticons[emo.index] = emo;
        await dbPut(`emoticon_${emo.index}`, emo.blob);
      }

      updateProgress(sheetIdx + 1, 4, sheetIdx < 3 ? `시트 ${sheetIdx + 2} 준비 중...` : '완료!');

    } catch (err) {
      console.error(`Sheet ${sheetIdx} failed:`, err);
      state.failedSheets.push(sheetIdx);
      const thumb = document.getElementById(`sheetThumb${sheetIdx}`);
      thumb.textContent = '!';
      thumb.style.borderColor = 'var(--c-error)';
      thumb.style.color = 'var(--c-error)';
      showToast(`시트 ${sheetIdx + 1} 생성 실패`, 'error');
    }
  }

  if (state.failedSheets.length > 0) {
    document.getElementById('retrySheetBtn').style.display = 'inline-flex';
    document.getElementById('progressDetail').textContent = `${4 - state.failedSheets.length}/4 시트 완성. 실패한 시트를 재시도해주세요.`;
  } else {
    await generateSpecialImages();
    showComplete();
  }
}

function initGenerating() {
  document.getElementById('retrySheetBtn').addEventListener('click', async () => {
    document.getElementById('retrySheetBtn').style.display = 'none';
    const failed = [...state.failedSheets];
    state.failedSheets = [];
    // Retry failed sheets (simplified — re-run startGeneration with only failed indices)
    // For simplicity, just re-run the whole generation
    showToast('실패한 시트를 재생성합니다...', 'info');
    await startGeneration();
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

  // Tab image 96x74
  const tabCanvas = new OffscreenCanvas(96, 74);
  const tabCtx = tabCanvas.getContext('2d');
  tabCtx.drawImage(mainBitmap, 0, 0, 96, 74);
  state.tabImage = await tabCanvas.convertToBlob({ type: 'image/png' });
  await dbPut('tabImage', state.tabImage);
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
  if (state.tabImage) {
    const tabItem = document.createElement('div');
    tabItem.className = 'special-item';
    const tabImg = document.createElement('img');
    tabImg.src = URL.createObjectURL(state.tabImage);
    tabImg.width = 96;
    tabImg.alt = '탭 이미지';
    const tabLabel = document.createElement('div');
    tabLabel.className = 'label-text';
    tabLabel.textContent = '탭 96\u00D774';
    tabItem.appendChild(tabImg);
    tabItem.appendChild(tabLabel);
    specialContainer.appendChild(tabItem);
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
}

function updateModalContent() {
  const emo = state.emoticons[currentModalIndex];
  if (!emo) return;
  document.getElementById('modalImage').src = URL.createObjectURL(emo.blob);
  document.getElementById('modalLabel').textContent = emo.label;
  document.getElementById('modalNum').textContent = `${currentModalIndex + 1} / 24`;
}

function initModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modalPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    currentModalIndex = (currentModalIndex - 1 + 24) % 24;
    updateModalContent();
  });
  document.getElementById('modalNext').addEventListener('click', (e) => {
    e.stopPropagation();
    currentModalIndex = (currentModalIndex + 1) % 24;
    updateModalContent();
  });
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('modalOverlay').classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') { currentModalIndex = (currentModalIndex - 1 + 24) % 24; updateModalContent(); }
    if (e.key === 'ArrowRight') { currentModalIndex = (currentModalIndex + 1) % 24; updateModalContent(); }
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
      if (state.tabImage) zip.file('tab.png', state.tabImage);
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
    state.tabImage = null;
    state.baseCharacter = null;
    state.baseCharacterUrl = null;
    state.baseCharacterBase64 = null;
    state.emoticonDefinitions = [];
    state.failedSheets = [];
    state.selectedStyle = null;
    state.uploadedPhoto = null;
    if (state.uploadedPhotoUrl) URL.revokeObjectURL(state.uploadedPhotoUrl);
    state.uploadedPhotoUrl = null;
    state.uploadedPhotoBase64 = null;
    state.characterName = 'My Character';
    document.getElementById('charNameInput').value = 'My Character';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('baseImage').style.display = 'none';
    document.getElementById('baseSkeleton').style.display = 'none';
    document.getElementById('emoticonListGrid').innerHTML = '';
    document.getElementById('emoticonGrid').innerHTML = '';
    document.getElementById('specialImages').innerHTML = '';
    document.getElementById('sheetStrip').innerHTML = '';
    document.getElementById('styleGrid').querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.style-tab').forEach((t, i) => { t.classList.toggle('active', i === 0); });
    document.getElementById('tabPresets').style.display = '';
    document.getElementById('tabCustom').style.display = 'none';
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
    state.tabImage = await dbGet('tabImage');
    if (baseBlob) {
      state.baseCharacter = baseBlob;
      state.baseCharacterUrl = URL.createObjectURL(baseBlob);
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
  try { await openDB(); } catch (e) { console.warn('IndexedDB unavailable'); }

  renderStepIndicator();
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
