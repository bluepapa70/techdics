// IT 용어 사전의 검색·필터·모달·즐겨찾기·다크모드 핵심 로직
'use strict';

/* ════════════════════════════════════════════
   1. 상태(State)
════════════════════════════════════════════ */
let allTerms         = [];        // 전체 용어 데이터
let filteredTerms    = [];        // 현재 필터 결과
let currentCategory  = 'all';
let currentQuery     = '';
let currentSort      = 'term';
let showFavoritesOnly = false;
let favorites        = new Set(); // LocalStorage 로드한 즐겨찾기 id Set
let currentModalId   = null;      // 현재 열린 모달의 용어 id
let toastTimer       = null;


/* ════════════════════════════════════════════
   2. DOM 참조
════════════════════════════════════════════ */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const elSearchInput     = $('search-input');
const elSearchClear     = $('search-clear');
const elBtnFavorites    = $('btn-favorites');
const elFavoritesCount  = $('favorites-count');
const elBtnDark         = $('btn-dark');
const elDarkIcon        = $('dark-icon');
const elCardsContainer  = $('cards-container');
const elResultsCount    = $('results-count');
const elSortSelect      = $('sort-select');
const elEmptyState      = $('empty-state');
const elFavoritesEmpty  = $('favorites-empty');
const elModalOverlay    = $('modal-overlay');
const elModalClose      = $('modal-close');
const elModalTerm       = $('modal-term');
const elModalTermKo     = $('modal-term-ko');
const elModalCatBadge   = $('modal-category-badge');
const elModalDiffBadge  = $('modal-difficulty-badge');
const elModalDef        = $('modal-definition');
const elModalTags       = $('modal-tags');
const elModalTagsWrap   = $('modal-tags-wrap');
const elModalRelated    = $('modal-related');
const elModalRelatedWrap = $('modal-related-wrap');
const elModalFavBtn     = $('modal-favorite-btn');
const elModalFavIcon    = $('modal-favorite-icon');
const elModalFavLabel   = $('modal-favorite-label');
const elLoading         = $('loading');
const elToast           = $('toast');


/* ════════════════════════════════════════════
   3. 카테고리 메타데이터
════════════════════════════════════════════ */
const CATEGORIES = {
  all:         { label: '전체',     icon: '' },
  ai:          { label: 'AI',       icon: '🤖' },
  network:     { label: '네트워크', icon: '🌐' },
  cloud:       { label: '클라우드', icon: '☁️' },
  dev:         { label: '개발',     icon: '💻' },
  security:    { label: '보안',     icon: '🔒' },
  data:        { label: '데이터',   icon: '🗄️' },
  engineering: { label: '공학',     icon: '🛠️' },
  malware:     { label: '멀웨어',   icon: '🦠' },
};

const DIFFICULTY_LABELS = {
  beginner:     '입문',
  intermediate: '중급',
  advanced:     '고급',
};


/* ════════════════════════════════════════════
   4. 데이터 로드 (fetch API)
════════════════════════════════════════════ */
async function loadData() {
  try {
    const res = await fetch('data/data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allTerms = await res.json();
    hideLoading();
    applyFilters();
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    elLoading.innerHTML = `
      <p style="color:#dc2626;text-align:center;padding:20px;line-height:1.8">
        ⚠️ 데이터를 불러오지 못했습니다.<br>
        <small>VS Code의 <strong>Live Server</strong> 또는 로컬 서버로 실행해 주세요.</small>
      </p>`;
  }
}

function hideLoading() {
  elLoading.style.opacity = '0';
  elLoading.style.transition = 'opacity .3s';
  setTimeout(() => { elLoading.style.display = 'none'; }, 320);
}


/* ════════════════════════════════════════════
   5. 필터 & 정렬
════════════════════════════════════════════ */
function applyFilters() {
  let result = allTerms;

  // 즐겨찾기 전용 모드
  if (showFavoritesOnly) {
    result = result.filter(t => favorites.has(t.id));
    if (result.length === 0) {
      renderCards([]);
      showEmpty('favorites');
      return;
    }
  }

  // 카테고리 필터
  if (currentCategory !== 'all') {
    result = result.filter(t => t.category === currentCategory);
  }

  // 텍스트 검색 필터
  if (currentQuery) {
    const q = currentQuery.toLowerCase();
    result = result.filter(t =>
      t.term.toLowerCase().includes(q) ||
      (t.termKo && t.termKo.toLowerCase().includes(q)) ||
      t.definition.toLowerCase().includes(q) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }

  // 정렬
  result = sortTerms(result, currentSort);

  filteredTerms = result;
  updateResultsCount(result.length);
  renderCards(result);
}

function sortTerms(terms, by) {
  return [...terms].sort((a, b) => {
    if (by === 'difficulty') {
      const order = { beginner: 0, intermediate: 1, advanced: 2 };
      return (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1);
    }
    if (by === 'category') {
      return a.category.localeCompare(b.category) || a.term.localeCompare(b.term, 'ko');
    }
    // 기본: 가나다/알파벳 혼합 정렬
    return a.term.localeCompare(b.term, 'ko');
  });
}

function updateResultsCount(count) {
  let html = `<strong>${count}</strong>개 용어`;
  if (currentQuery) html += ` — "<em>${escapeHtml(currentQuery)}</em>" 검색 결과`;
  if (showFavoritesOnly) html += ` (즐겨찾기)`;
  elResultsCount.innerHTML = html;
}


/* ════════════════════════════════════════════
   6. 카드 렌더링
════════════════════════════════════════════ */
function renderCards(terms) {
  hideEmpty();
  elCardsContainer.innerHTML = '';

  if (terms.length === 0) {
    showEmpty(showFavoritesOnly ? 'favorites' : 'search');
    return;
  }

  const fragment = document.createDocumentFragment();
  terms.forEach(term => fragment.appendChild(buildCard(term)));
  elCardsContainer.appendChild(fragment);
}

function buildCard(term) {
  const isFav     = favorites.has(term.id);
  const cat       = CATEGORIES[term.category] || { label: term.category, icon: '' };
  const diffLabel = DIFFICULTY_LABELS[term.difficulty] || term.difficulty;

  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('data-category', term.category);
  card.setAttribute('data-id', term.id);
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${term.term} 상세보기`);

  const hTerm   = highlight(escapeHtml(term.term), currentQuery);
  const hTermKo = term.termKo ? highlight(escapeHtml(term.termKo), currentQuery) : '';
  const hDef    = highlight(escapeHtml(term.definition), currentQuery);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title-wrap">
        <div class="card-term">${hTerm}</div>
        ${hTermKo ? `<div class="card-term-ko">${hTermKo}</div>` : ''}
      </div>
      <button class="card-favorite ${isFav ? 'active' : ''}"
              data-id="${term.id}"
              aria-label="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}"
              title="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
        ${isFav ? '★' : '☆'}
      </button>
    </div>
    <p class="card-definition">${hDef}</p>
    <div class="card-footer">
      <span class="category-badge" data-cat="${term.category}">${cat.icon} ${cat.label}</span>
      <span class="difficulty-badge" data-level="${term.difficulty}">${diffLabel}</span>
    </div>
  `;

  // 카드 클릭 → 모달 열기 (즐겨찾기 버튼 제외)
  card.addEventListener('click', e => {
    if (e.target.closest('.card-favorite')) return;
    openModal(term.id);
  });

  // 키보드 접근성 (Enter / Space)
  card.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.card-favorite')) {
      e.preventDefault();
      openModal(term.id);
    }
  });

  // 카드 즐겨찾기 버튼
  card.querySelector('.card-favorite').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(term.id);
  });

  return card;
}


/* ════════════════════════════════════════════
   7. 모달
════════════════════════════════════════════ */
function openModal(id) {
  const term = allTerms.find(t => t.id === id);
  if (!term) return;

  currentModalId = id;

  const cat       = CATEGORIES[term.category] || { label: term.category, icon: '' };
  const diffLabel = DIFFICULTY_LABELS[term.difficulty] || term.difficulty;
  const isFav     = favorites.has(id);

  // 기본 정보
  elModalTerm.textContent   = term.term;
  elModalTermKo.textContent = term.termKo || '';
  elModalDef.textContent    = term.definition;

  // 카테고리 뱃지
  elModalCatBadge.textContent = `${cat.icon} ${cat.label}`;
  elModalCatBadge.setAttribute('data-cat', term.category);

  // 난이도 뱃지
  elModalDiffBadge.textContent = diffLabel;
  elModalDiffBadge.setAttribute('data-level', term.difficulty);

  // 태그
  if (term.tags && term.tags.length > 0) {
    elModalTags.innerHTML = term.tags
      .map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
      .join('');
    elModalTagsWrap.classList.remove('hidden');
  } else {
    elModalTagsWrap.classList.add('hidden');
  }

  // 관련 용어
  if (term.related && term.related.length > 0) {
    elModalRelated.innerHTML = term.related.map(relId => {
      const relTerm = allTerms.find(t => t.id === relId);
      const label   = relTerm ? relTerm.term : relId;
      return `<button class="related-link" data-id="${escapeHtml(relId)}">${escapeHtml(label)}</button>`;
    }).join('');

    elModalRelated.querySelectorAll('.related-link').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.id));
    });
    elModalRelatedWrap.classList.remove('hidden');
  } else {
    elModalRelatedWrap.classList.add('hidden');
  }

  // 즐겨찾기 버튼 상태
  syncModalFavBtn(isFav);

  // 모달 열기
  elModalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => elModalClose.focus(), 50);
}

function closeModal() {
  elModalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  currentModalId = null;
}

function syncModalFavBtn(isFav) {
  elModalFavIcon.textContent  = isFav ? '★' : '☆';
  elModalFavLabel.textContent = isFav ? '즐겨찾기 해제' : '즐겨찾기에 추가';
  elModalFavBtn.classList.toggle('active', isFav);
}


/* ════════════════════════════════════════════
   8. 즐겨찾기
════════════════════════════════════════════ */
function loadFavorites() {
  try {
    const saved = localStorage.getItem('techdics-favorites');
    favorites = new Set(saved ? JSON.parse(saved) : []);
  } catch {
    favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem('techdics-favorites', JSON.stringify([...favorites]));
}

function toggleFavorite(id) {
  const adding = !favorites.has(id);

  if (adding) {
    favorites.add(id);
    showToast('⭐ 즐겨찾기에 추가했습니다');
  } else {
    favorites.delete(id);
    showToast('즐겨찾기에서 제거했습니다');
  }

  saveFavorites();
  updateFavoritesCount();

  // 카드 즐겨찾기 버튼 동기화
  const cardBtn = elCardsContainer.querySelector(`.card-favorite[data-id="${id}"]`);
  if (cardBtn) {
    cardBtn.textContent = adding ? '★' : '☆';
    cardBtn.classList.toggle('active', adding);
    cardBtn.setAttribute('aria-label', adding ? '즐겨찾기 해제' : '즐겨찾기 추가');
  }

  // 모달 버튼 동기화
  if (currentModalId === id) syncModalFavBtn(adding);

  // 즐겨찾기 전용 모드에서 제거 시 목록 갱신
  if (showFavoritesOnly && !adding) applyFilters();
}

function updateFavoritesCount() {
  const count = favorites.size;
  elFavoritesCount.textContent = count;
  elFavoritesCount.classList.toggle('hidden', count === 0);
}

function toggleFavoritesMode() {
  showFavoritesOnly = !showFavoritesOnly;
  elBtnFavorites.classList.toggle('active', showFavoritesOnly);

  // 즐겨찾기 해제 시 카테고리 탭 복원
  if (!showFavoritesOnly) {
    applyFilters();
  } else {
    // 즐겨찾기 모드 진입 시 탭 초기화
    currentCategory = 'all';
    $$('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.category === 'all');
      t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
    });
    applyFilters();
  }
}


/* ════════════════════════════════════════════
   9. 다크 모드
════════════════════════════════════════════ */
function loadTheme() {
  const saved = localStorage.getItem('techdics-theme');
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  elDarkIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('techdics-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}


/* ════════════════════════════════════════════
   10. Empty State
════════════════════════════════════════════ */
function showEmpty(type) {
  elCardsContainer.innerHTML = '';
  if (type === 'favorites') {
    elFavoritesEmpty.classList.remove('hidden');
    elEmptyState.classList.add('hidden');
  } else {
    elEmptyState.classList.remove('hidden');
    elFavoritesEmpty.classList.add('hidden');
  }
}

function hideEmpty() {
  elEmptyState.classList.add('hidden');
  elFavoritesEmpty.classList.add('hidden');
}


/* ════════════════════════════════════════════
   11. 토스트 알림
════════════════════════════════════════════ */
function showToast(message) {
  clearTimeout(toastTimer);
  elToast.textContent = message;
  elToast.classList.remove('hidden', 'toast-out');

  toastTimer = setTimeout(() => {
    elToast.classList.add('toast-out');
    setTimeout(() => elToast.classList.add('hidden'), 260);
  }, 2000);
}


/* ════════════════════════════════════════════
   12. 유틸
════════════════════════════════════════════ */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// XSS 방지: HTML 특수문자 이스케이프
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 검색어 하이라이팅 (이미 escapeHtml 처리된 text에 적용)
function highlight(escapedText, query) {
  if (!query) return escapedText;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  return escapedText.replace(regex, '<mark class="highlight">$1</mark>');
}


/* ════════════════════════════════════════════
   13. 이벤트 바인딩
════════════════════════════════════════════ */
function bindEvents() {

  // ── 검색 ──
  const debouncedSearch = debounce(value => {
    currentQuery = value.trim();
    elSearchClear.classList.toggle('hidden', currentQuery === '');
    applyFilters();
  }, 300);

  elSearchInput.addEventListener('input', e => debouncedSearch(e.target.value));

  elSearchClear.addEventListener('click', () => {
    elSearchInput.value = '';
    currentQuery = '';
    elSearchClear.classList.add('hidden');
    elSearchInput.focus();
    applyFilters();
  });

  // 검색창 Enter: 즉시 검색 (debounce 우선)
  elSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      currentQuery = elSearchInput.value.trim();
      elSearchClear.classList.toggle('hidden', currentQuery === '');
      applyFilters();
    }
  });

  // ── 카테고리 탭 ──
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (showFavoritesOnly) return; // 즐겨찾기 모드에서는 탭 비활성
      $$('.tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentCategory = tab.dataset.category;
      applyFilters();
    });
  });

  // ── 정렬 ──
  elSortSelect.addEventListener('change', e => {
    currentSort = e.target.value;
    applyFilters();
  });

  // ── 즐겨찾기 버튼 ──
  elBtnFavorites.addEventListener('click', toggleFavoritesMode);

  // ── 다크 모드 버튼 ──
  elBtnDark.addEventListener('click', toggleTheme);

  // ── 모달 닫기: ✕ 버튼 ──
  elModalClose.addEventListener('click', closeModal);

  // ── 모달 닫기: 오버레이 외부 클릭 ──
  elModalOverlay.addEventListener('click', e => {
    if (e.target === elModalOverlay) closeModal();
  });

  // ── 모달 닫기: ESC 키 ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !elModalOverlay.classList.contains('hidden')) {
      closeModal();
    }
  });

  // ── 모달 즐겨찾기 버튼 ──
  elModalFavBtn.addEventListener('click', () => {
    if (currentModalId) toggleFavorite(currentModalId);
  });

  // ── OS 다크모드 변경 감지 ──
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('techdics-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}


/* ════════════════════════════════════════════
   14. 초기화
════════════════════════════════════════════ */
function init() {
  loadTheme();
  loadFavorites();
  updateFavoritesCount();
  bindEvents();
  loadData();
}

init();
