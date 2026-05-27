import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// ─── Firebase 초기화 ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain: "astro-bugil-a1dd7.firebaseapp.com",
  projectId: "astro-bugil-a1dd7",
  storageBucket: "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId: "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId: "G-21GJSVVG2G"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── 권한 설정 ─────────────────────────────────────────────────────────────────
/**
 * 운영담당자(OWNER): 모든 권한 보유 — 관리자 임명/해제, 배너 관리, 콘솔 접근
 * 관리자(ADMIN):     공지사항 CRUD만 가능. 새 관리자 임명 불가.
 */
const OWNER_EMAILS = [
  'yunthomas0120@gmail.com',
  'yunarchive0120@gmail.com'
];

function isOwner(user) {
  return !!user && OWNER_EMAILS.includes(user.email);
}

/**
 * Firestore 'admins' 컬렉션에서 관리자 여부 확인
 * 캐시를 사용해 매번 쿼리하지 않도록 함
 */
let _adminCache = null; // Set<string>

async function refreshAdminCache() {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    _adminCache = new Set(snap.docs.map(d => d.id));
  } catch {
    _adminCache = new Set();
  }
}

async function isAdmin(user) {
  if (!user) return false;
  if (isOwner(user)) return true;
  if (!_adminCache) await refreshAdminCache();
  return _adminCache.has(user.email);
}

// ─── 토스트 ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── 공지사항 CRUD ─────────────────────────────────────────────────────────────
async function loadNotices() {
  const list = document.getElementById('notice-list');
  list.innerHTML =
    '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">불러오는 중...</p>';

  try {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML =
        '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">등록된 공지사항이 없습니다.</p>';
      return;
    }

    snap.forEach(d => renderNotice(d.id, d.data()));
  } catch (e) {
    list.innerHTML =
      `<p style="padding:1rem 1.25rem;color:#dc2626;font-size:0.85rem;">불러오기 실패: ${e.message}</p>`;
  }
}

function renderNotice(id, data) {
  const list = document.getElementById('notice-list');
  const isNew = data.createdAt &&
    (Date.now() - data.createdAt.toMillis() < 7 * 24 * 60 * 60 * 1000);
  const date = data.createdAt
    ? new Date(data.createdAt.toMillis()).toLocaleDateString('ko-KR')
    : '';

  const item = document.createElement('div');
  item.className = 'notice-item';
  item.dataset.id = id;
  item.innerHTML = `
    <span class="notice-badge${isNew ? ' new' : ''}">${isNew ? 'NEW' : '공지'}</span>
    <span class="notice-title">${escHtml(data.title)}</span>
    <span class="notice-date">${date}</span>
    <button class="notice-del-btn" data-id="${id}" title="삭제" style="display:none">✕</button>
  `;
  list.appendChild(item);
}

async function addNotice(title, user) {
  if (!(await isAdmin(user))) {
    toast('관리자만 공지사항을 등록할 수 있습니다.', 'error');
    return;
  }
  await addDoc(collection(db, 'notices'), { title, createdAt: serverTimestamp() });
  await loadNotices();
  updateDelButtons();
  toast('공지사항이 등록되었습니다.', 'success');
}

async function deleteNotice(id, user) {
  if (!(await isAdmin(user))) {
    toast('관리자만 삭제할 수 있습니다.', 'error');
    return;
  }
  if (!confirm('공지사항을 삭제할까요?')) return;
  await deleteDoc(doc(db, 'notices', id));
  await loadNotices();
  updateDelButtons();
  toast('공지사항이 삭제되었습니다.', 'info');
}

async function updateDelButtons() {
  const user = auth.currentUser;
  const ok = await isAdmin(user);
  document.querySelectorAll('.notice-del-btn').forEach(btn => {
    btn.style.display = ok ? 'inline-block' : 'none';
  });
}

// ─── 가입 신청 ─────────────────────────────────────────────────────────────────
async function submitApplication(data) {
  await addDoc(collection(db, 'applications'), {
    ...data,
    status: 'pending',
    submittedAt: serverTimestamp()
  });
}

// ─── 사이트 배너 ───────────────────────────────────────────────────────────────
const BANNER_KEY = 'astro_banner_dismissed'; // localStorage key prefix

async function loadAndShowBanner() {
  try {
    const snap = await getDoc(doc(db, 'config', 'site_banner'));
    if (!snap.exists() || !snap.data().active) return;

    const data = snap.data();
    const bannerId = data.updatedAt ? String(data.updatedAt.toMillis()) : 'default';

    // 오늘 하루 보지 않기 체크
    const dismissed = localStorage.getItem(`${BANNER_KEY}_${bannerId}`);
    if (dismissed) {
      const until = parseInt(dismissed, 10);
      if (Date.now() < until) return;
    }

    showBanner(data, bannerId);
  } catch (e) {
    // 배너 로드 실패는 조용히 무시
  }
}

function showBanner(data, bannerId) {
  const banner = document.getElementById('site-banner');
  const iconEl = document.getElementById('banner-icon');
  const textEl = document.getElementById('banner-text');
  const dismissBtn = document.getElementById('banner-dismiss-today');
  const closeBtn = document.getElementById('banner-close');

  // 유형별 스타일
  const typeMap = {
    info:    { cls: 'banner-info',    icon: 'ℹ️' },
    warning: { cls: 'banner-warning', icon: '⚠️' },
    danger:  { cls: 'banner-danger',  icon: '🚨' }
  };
  const t = typeMap[data.type] || typeMap.info;

  banner.className = ''; // reset
  banner.classList.add(t.cls);
  iconEl.textContent = t.icon;
  textEl.textContent = data.message;
  banner.style.display = 'flex';

  // "오늘 하루 보지 않기" 표시 여부
  dismissBtn.style.display = data.dismissible !== false ? 'inline' : 'none';

  // 이벤트: 오늘 하루 보지 않기
  dismissBtn.onclick = () => {
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    localStorage.setItem(`${BANNER_KEY}_${bannerId}`, String(midnight.getTime()));
    banner.style.display = 'none';
  };

  // 이벤트: 그냥 닫기 (세션 동안 숨김)
  closeBtn.onclick = () => {
    banner.style.display = 'none';
  };
}

async function saveBanner(data, user) {
  if (!isOwner(user)) {
    toast('운영담당자만 배너를 설정할 수 있습니다.', 'error');
    return;
  }
  await setDoc(doc(db, 'config', 'site_banner'), {
    ...data,
    updatedAt: serverTimestamp()
  });
  toast('배너가 저장되었습니다.', 'success');
  loadAndShowBanner();
  refreshCurrentBannerInfo();
}

async function removeBanner(user) {
  if (!isOwner(user)) {
    toast('운영담당자만 배너를 제거할 수 있습니다.', 'error');
    return;
  }
  if (!confirm('배너를 제거할까요?')) return;
  await setDoc(doc(db, 'config', 'site_banner'), { active: false, updatedAt: serverTimestamp() });
  document.getElementById('site-banner').style.display = 'none';
  toast('배너가 제거되었습니다.', 'info');
  refreshCurrentBannerInfo();
}

async function refreshCurrentBannerInfo() {
  const el = document.getElementById('current-banner-info');
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, 'config', 'site_banner'));
    if (!snap.exists() || !snap.data().active) {
      el.innerHTML = '<span style="color:var(--gray);">현재 활성 배너 없음</span>';
    } else {
      const d = snap.data();
      const typeLabels = { info: '안내', warning: '경고', danger: '긴급' };
      el.innerHTML = `
        <strong>유형:</strong> ${typeLabels[d.type] || d.type} &nbsp;|&nbsp;
        <strong>메시지:</strong> ${escHtml(d.message)} &nbsp;|&nbsp;
        <strong>오늘 하루 보지 않기:</strong> ${d.dismissible !== false ? '표시' : '미표시'}
      `;
    }
  } catch {
    el.textContent = '배너 정보를 불러올 수 없습니다.';
  }
}

// ─── 관리자 관리 ───────────────────────────────────────────────────────────────
async function loadAdminsForConsole() {
  const listEl = document.getElementById('console-admin-list');
  listEl.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';

  const items = [];

  // 운영담당자 항목
  OWNER_EMAILS.forEach(email => {
    items.push({ email, role: 'owner' });
  });

  // Firestore 관리자
  try {
    const snap = await getDocs(collection(db, 'admins'));
    snap.forEach(d => {
      if (!OWNER_EMAILS.includes(d.id)) {
        items.push({ email: d.id, role: 'admin', docId: d.id });
      }
    });
  } catch {/* ignore */}

  listEl.innerHTML = '';

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'admin-item';

    const initial = item.email.charAt(0).toUpperCase();
    const avatarCls = item.role === 'owner' ? 'owner' : '';
    const badgeCls  = item.role === 'owner' ? 'owner' : 'admin';
    const badgeText = item.role === 'owner' ? '운영담당자' : '관리자';

    el.innerHTML = `
      <div class="admin-avatar ${avatarCls}">${initial}</div>
      <div class="admin-info">
        <div class="admin-email">${escHtml(item.email)}</div>
        <div class="admin-role">${item.role === 'owner' ? '모든 권한 보유' : '공지 CRUD 권한'}</div>
      </div>
      <span class="admin-role-badge ${badgeCls}">${badgeText}</span>
      ${item.role === 'admin'
        ? `<button class="btn btn-xs btn-outline admin-revoke-btn" data-email="${escHtml(item.email)}" style="color:var(--red);border-color:var(--red);">해제</button>`
        : ''}
    `;
    listEl.appendChild(el);
  });

  // 해제 버튼 이벤트
  listEl.querySelectorAll('.admin-revoke-btn').forEach(btn => {
    btn.addEventListener('click', () => revokeAdmin(btn.dataset.email));
  });
}

async function addAdmin(email) {
  const user = auth.currentUser;
  if (!isOwner(user)) {
    toast('운영담당자만 관리자를 추가할 수 있습니다.', 'error');
    return;
  }

  email = email.trim().toLowerCase();
  if (!email.includes('@')) {
    document.getElementById('admin-add-error').textContent = '올바른 이메일 형식을 입력하세요.';
    return;
  }

  if (OWNER_EMAILS.includes(email)) {
    document.getElementById('admin-add-error').textContent = '운영담당자 이메일은 추가할 수 없습니다.';
    return;
  }

  try {
    await setDoc(doc(db, 'admins', email), {
      addedBy: user.email,
      addedAt: serverTimestamp()
    });
    _adminCache = null; // 캐시 초기화
    document.getElementById('admin-add-error').textContent = '';
    document.getElementById('new-admin-email').value = '';
    toast(`${email} 를 관리자로 추가했습니다.`, 'success');
    loadAdminsForConsole();
    loadConsoleStats();
  } catch (e) {
    document.getElementById('admin-add-error').textContent = '추가 실패: ' + e.message;
  }
}

async function revokeAdmin(email) {
  const user = auth.currentUser;
  if (!isOwner(user)) {
    toast('운영담당자만 관리자를 해제할 수 있습니다.', 'error');
    return;
  }
  if (!confirm(`${email} 의 관리자 권한을 해제할까요?`)) return;

  try {
    await deleteDoc(doc(db, 'admins', email));
    _adminCache = null;
    toast(`${email} 의 관리자 권한을 해제했습니다.`, 'info');
    loadAdminsForConsole();
    loadConsoleStats();
  } catch (e) {
    toast('해제 실패: ' + e.message, 'error');
  }
}

// ─── 신청자 목록 ───────────────────────────────────────────────────────────────
async function loadApplicants() {
  const listEl = document.getElementById('applicant-list');
  listEl.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';

  try {
    const q = query(collection(db, 'applications'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          아직 가입 신청이 없습니다.
        </div>`;
      return;
    }

    listEl.innerHTML = '';
    snap.forEach(d => renderApplicant(d.id, d.data(), listEl));

  } catch (e) {
    listEl.innerHTML = `<div style="color:var(--red);font-size:0.85rem;">불러오기 실패: ${e.message}</div>`;
  }
}

function renderApplicant(id, data, container) {
  const statusMap = {
    pending:  { label: '대기 중',  cls: 'pending' },
    approved: { label: '승인됨',   cls: 'approved' },
    rejected: { label: '거절됨',   cls: 'rejected' }
  };
  const st = statusMap[data.status] || statusMap.pending;
  const date = data.submittedAt
    ? new Date(data.submittedAt.toMillis()).toLocaleDateString('ko-KR')
    : '';

  const el = document.createElement('div');
  el.className = 'applicant-item';
  el.dataset.id = id;

  el.innerHTML = `
    <div class="applicant-header">
      <span class="applicant-name">${escHtml(data.name || '이름 없음')}</span>
      <span class="applicant-grade">${escHtml(data.grade || '')}</span>
      <span class="applicant-status ${st.cls}">${st.label}</span>
      <span style="font-size:0.75rem;color:var(--gray);margin-left:0.25rem;">${date}</span>
      <span style="margin-left:auto;font-size:0.75rem;color:var(--gray);">▸</span>
    </div>
    <div class="applicant-detail">
      <p><strong>연락처:</strong> ${escHtml(data.contact || '없음')}</p>
      <p><strong>지원 동기:</strong></p>
      <p style="white-space:pre-wrap;line-height:1.6;margin-top:0.25rem;">${escHtml(data.reason || '')}</p>
      <div class="applicant-actions">
        <button class="btn btn-green btn-xs approve-btn" data-id="${id}">✓ 승인</button>
        <button class="btn btn-red btn-xs reject-btn" data-id="${id}">✕ 거절</button>
        <button class="btn btn-outline btn-xs delete-applicant-btn" data-id="${id}" style="margin-left:auto;">삭제</button>
      </div>
    </div>
  `;

  // 헤더 클릭 → 상세 토글
  el.querySelector('.applicant-header').addEventListener('click', () => {
    el.querySelector('.applicant-detail').classList.toggle('open');
  });

  // 승인 / 거절 / 삭제
  el.querySelector('.approve-btn').addEventListener('click', async e => {
    e.stopPropagation();
    await updateDoc(doc(db, 'applications', id), { status: 'approved' });
    toast('승인 처리되었습니다.', 'success');
    loadApplicants();
    loadConsoleStats();
  });

  el.querySelector('.reject-btn').addEventListener('click', async e => {
    e.stopPropagation();
    await updateDoc(doc(db, 'applications', id), { status: 'rejected' });
    toast('거절 처리되었습니다.', 'info');
    loadApplicants();
    loadConsoleStats();
  });

  el.querySelector('.delete-applicant-btn').addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('신청서를 완전히 삭제할까요?')) return;
    await deleteDoc(doc(db, 'applications', id));
    toast('신청서가 삭제되었습니다.', 'info');
    loadApplicants();
    loadConsoleStats();
  });

  container.appendChild(el);
}

// ─── 콘솔 공지 목록 ────────────────────────────────────────────────────────────
async function loadConsoleNotices() {
  const listEl = document.getElementById('console-notice-list');
  listEl.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';

  try {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span>등록된 공지사항이 없습니다.</div>';
      return;
    }

    listEl.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const date = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ko-KR') : '';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.85rem;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;';
      row.innerHTML = `
        <span style="flex:1;color:var(--ink);">${escHtml(data.title)}</span>
        <span style="color:var(--gray);font-size:0.75rem;flex-shrink:0;">${date}</span>
        <button class="btn btn-xs btn-outline" style="color:var(--red);border-color:var(--red);" data-id="${d.id}">삭제</button>
      `;
      row.querySelector('button').addEventListener('click', async () => {
        if (!confirm('삭제할까요?')) return;
        await deleteDoc(doc(db, 'notices', d.id));
        toast('삭제되었습니다.', 'info');
        loadNotices();
        loadConsoleNotices();
        loadConsoleStats();
      });
      listEl.appendChild(row);
    });

  } catch (e) {
    listEl.innerHTML = `<div style="color:var(--red);font-size:0.85rem;">실패: ${e.message}</div>`;
  }
}

// ─── 콘솔 통계 ─────────────────────────────────────────────────────────────────
async function loadConsoleStats() {
  try {
    const [noticeSnap, appSnap, adminSnap] = await Promise.all([
      getDocs(collection(db, 'notices')),
      getDocs(collection(db, 'applications')),
      getDocs(collection(db, 'admins'))
    ]);

    document.getElementById('stat-notices').textContent = noticeSnap.size;
    document.getElementById('stat-applicants').textContent = appSnap.size;

    let pending = 0;
    appSnap.forEach(d => { if ((d.data().status || 'pending') === 'pending') pending++; });
    document.getElementById('stat-pending').textContent = pending;

    // 운영담당자 제외한 관리자 수
    const adminEmails = new Set(adminSnap.docs.map(d => d.id).filter(e => !OWNER_EMAILS.includes(e)));
    document.getElementById('stat-admins').textContent = adminEmails.size;
  } catch {/* ignore */}
}

// ─── Auth 상태 감지 ────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  const loginBtn     = document.getElementById('login-btn');
  const userMenuWrap = document.getElementById('user-menu-wrap');
  const userInfo     = document.getElementById('user-info');
  const adminPanel   = document.getElementById('admin-panel');
  const openConsoleBtn  = document.getElementById('open-console-btn');
  const consoleDivider  = document.getElementById('console-divider');

  if (user) {
    loginBtn.style.display = 'none';
    userMenuWrap.style.display = 'flex';

    const name = user.displayName || user.email;

    if (isOwner(user)) {
      userInfo.textContent = `👑 ${name}`;
      userInfo.style.display = 'inline';
      openConsoleBtn.style.display = 'block';
      consoleDivider.style.display = 'block';
    } else {
      const adminOk = await isAdmin(user);
      userInfo.textContent = adminOk ? `💻 ${name}` : name;
      userInfo.style.display = 'inline';
      openConsoleBtn.style.display = 'none';
      consoleDivider.style.display = 'none';
    }

    const adminOk = await isAdmin(user);
    if (adminPanel) adminPanel.style.display = adminOk ? 'block' : 'none';

  } else {
    loginBtn.style.display = 'inline-block';
    userMenuWrap.style.display = 'none';
    userInfo.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }

  updateDelButtons();
});

// ─── 콘솔 탭 전환 ──────────────────────────────────────────────────────────────
function switchConsoleTab(tabId) {
  document.querySelectorAll('.console-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.console-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabId}`);
  });

  // 탭별 데이터 로드
  if (tabId === 'admins') loadAdminsForConsole();
  if (tabId === 'banner') refreshCurrentBannerInfo();
  if (tabId === 'applicants') loadApplicants();
  if (tabId === 'notices') loadConsoleNotices();
  if (tabId === 'overview') loadConsoleStats();
}

// 전역 노출 (인라인 onclick 에서 사용)
window.switchConsoleTab = switchConsoleTab;

// ─── DOM 로드 후 이벤트 바인딩 ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {

  loadNotices();
  loadAndShowBanner();

  // ── 드롭다운 토글 ──
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');

  userMenuBtn.addEventListener('click', e => {
    e.stopPropagation();
    userDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    userDropdown.classList.remove('open');
  });

  // ── 로그인 버튼 ──
  document.getElementById('login-btn').addEventListener('click', () => {
    openModal('login-modal');
  });

  // ── 로그아웃 ──
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await signOut(auth);
      toast('로그아웃되었습니다.', 'info');
    } catch (e) {
      toast('로그아웃 실패: ' + e.message, 'error');
    }
    userDropdown.classList.remove('open');
  });

  // ── 운영자 콘솔 열기 ──
  document.getElementById('open-console-btn').addEventListener('click', () => {
    userDropdown.classList.remove('open');
    openModal('console-modal');
    loadConsoleStats();
  });

  // ── 모달 닫기 ──
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // ── 이메일 로그인 ──
  document.getElementById('email-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pw    = document.getElementById('login-pw').value;
    const err   = document.getElementById('login-error');
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      closeAllModals();
      toast('로그인되었습니다.', 'success');
    } catch (ex) {
      err.textContent = '로그인 실패: ' + translateAuthError(ex.code);
    }
  });

  // ── 구글 로그인 ──
  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      closeAllModals();
      toast('Google 로그인 성공', 'success');
    } catch (ex) {
      document.getElementById('login-error').textContent = translateAuthError(ex.code);
    }
  });

  // ── 회원가입 탭 전환 ──
  document.getElementById('go-signup').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-tab').style.display  = 'none';
    document.getElementById('signup-tab').style.display = 'block';
    document.getElementById('login-error').textContent  = '';
  });

  document.getElementById('go-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('signup-tab').style.display = 'none';
    document.getElementById('login-tab').style.display  = 'block';
  });

  // ── 이메일 회원가입 ──
  document.getElementById('email-signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const pw    = document.getElementById('signup-pw').value;
    const err   = document.getElementById('signup-error');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      closeAllModals();
      toast('가입이 완료되었습니다.', 'success');
    } catch (ex) {
      err.textContent = '가입 실패: ' + translateAuthError(ex.code);
    }
  });

  // ── 공지사항 추가 (관리자 패널) ──
  document.getElementById('notice-add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('notice-input').value.trim();
    if (!title) return;
    const btn = e.submitter;
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
      await addNotice(title, auth.currentUser);
      document.getElementById('notice-input').value = '';
    } catch (ex) {
      toast('저장 실패: ' + ex.message, 'error');
    }
    btn.disabled = false; btn.textContent = '등록';
  });

  // ── 공지 삭제 ──
  document.getElementById('notice-list').addEventListener('click', e => {
    const btn = e.target.closest('.notice-del-btn');
    if (btn) deleteNotice(btn.dataset.id, auth.currentUser);
  });

  // ── 가입 신청 폼 열기 ──
  document.getElementById('open-join-form').addEventListener('click', () => openModal('join-modal'));

  // ── 가입 신청 제출 ──
  document.getElementById('join-form').addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      name:    document.getElementById('join-name').value,
      grade:   document.getElementById('join-grade').value,
      reason:  document.getElementById('join-reason').value,
      contact: document.getElementById('join-contact').value
    };
    const btn = e.submitter;
    btn.disabled = true; btn.textContent = '제출 중...';
    try {
      await submitApplication(data);
      closeAllModals();
      toast('✅ 가입 신청이 완료되었습니다!', 'success');
      document.getElementById('join-form').reset();
    } catch (ex) {
      toast('제출 실패: ' + ex.message, 'error');
    }
    btn.disabled = false; btn.textContent = '신청하기';
  });

  // ── 콘솔 탭 클릭 ──
  document.querySelectorAll('.console-tab').forEach(tab => {
    tab.addEventListener('click', () => switchConsoleTab(tab.dataset.tab));
  });

  // ── 관리자 추가 ──
  document.getElementById('add-admin-btn').addEventListener('click', () => {
    const email = document.getElementById('new-admin-email').value;
    addAdmin(email);
  });

  document.getElementById('new-admin-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAdmin(e.target.value);
    }
  });

  // ── 배너 유형 선택 ──
  const bannerTypeBtns = document.querySelectorAll('.banner-type-btn');
  bannerTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bannerTypeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateBannerPreview();
    });
  });

  // ── 배너 메시지 입력 미리보기 ──
  document.getElementById('banner-msg-input').addEventListener('input', updateBannerPreview);

  function updateBannerPreview() {
    const msg = document.getElementById('banner-msg-input').value;
    const type = document.querySelector('.banner-type-btn.selected')?.dataset.type || 'info';
    const preview = document.getElementById('banner-preview-box');
    const iconEl  = document.getElementById('preview-icon');
    const textEl  = document.getElementById('preview-text');

    const typeMap = {
      info:    { cls: 'banner-info',    icon: 'ℹ️' },
      warning: { cls: 'banner-warning', icon: '⚠️' },
      danger:  { cls: 'banner-danger',  icon: '🚨' }
    };
    const t = typeMap[type];

    if (msg.trim()) {
      preview.className = `banner-preview visible ${t.cls}`;
      preview.style.borderRadius = '8px';
      iconEl.textContent = t.icon;
      textEl.textContent = msg;
    } else {
      preview.className = 'banner-preview';
    }
  }

  // ── 배너 저장 ──
  document.getElementById('save-banner-btn').addEventListener('click', async () => {
    const msg  = document.getElementById('banner-msg-input').value.trim();
    const type = document.querySelector('.banner-type-btn.selected')?.dataset.type || 'info';
    const dismissible = document.getElementById('banner-dismissible').checked;

    if (!msg) {
      toast('배너 메시지를 입력하세요.', 'error');
      return;
    }

    await saveBanner({ active: true, message: msg, type, dismissible }, auth.currentUser);
  });

  // ── 배너 제거 ──
  document.getElementById('remove-banner-btn').addEventListener('click', () => {
    removeBanner(auth.currentUser);
  });

  // ── 콘솔 공지 추가 ──
  document.getElementById('console-add-notice-btn').addEventListener('click', async () => {
    const input = document.getElementById('console-notice-input');
    const title = input.value.trim();
    if (!title) return;
    await addNotice(title, auth.currentUser);
    input.value = '';
    loadConsoleNotices();
    loadConsoleStats();
  });

  document.getElementById('console-notice-input').addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const title = e.target.value.trim();
      if (!title) return;
      await addNotice(title, auth.currentUser);
      e.target.value = '';
      loadConsoleNotices();
      loadConsoleStats();
    }
  });

});

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  document.body.style.overflow = '';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function translateAuthError(code) {
  const map = {
    'auth/user-not-found':      '등록되지 않은 이메일입니다.',
    'auth/wrong-password':      '비밀번호가 틀렸습니다.',
    'auth/invalid-email':       '이메일 형식이 잘못되었습니다.',
    'auth/email-already-in-use':'이미 사용 중인 이메일입니다.',
    'auth/weak-password':       '비밀번호는 6자 이상이어야 합니다.',
    'auth/popup-closed-by-user':'로그인 창이 닫혔습니다.',
    'auth/invalid-credential':  '이메일 또는 비밀번호가 올바르지 않습니다.'
  };
  return map[code] || code;
}
