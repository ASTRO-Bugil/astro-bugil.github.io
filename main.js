import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, setDoc, getDoc, updateDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// ── Firebase 초기화 ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain:        "astro-bugil-a1dd7.firebaseapp.com",
  projectId:         "astro-bugil-a1dd7",
  storageBucket:     "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId:             "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId:     "G-21GJSVVG2G"
};

const app  = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db   = getFirestore(app);
const gp   = new GoogleAuthProvider();

// ── 권한 ──────────────────────────────────────────────────────────────────────
const OWNER_EMAILS = ['yunthomas0120@gmail.com', 'yunarchive0120@gmail.com'];

function isOwner(user) { return !!user && OWNER_EMAILS.includes(user.email); }

let _adminSet = null;
async function fetchAdmins() {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    _adminSet = new Set(snap.docs.map(d => d.id));
  } catch { _adminSet = new Set(); }
}
async function checkAdmin(user) {
  if (!user) return false;
  if (isOwner(user)) return true;
  if (!_adminSet) await fetchAdmins();
  return _adminSet.has(user.email);
}

// ── 토스트 ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(ts) {
  return ts ? new Date(ts.toMillis()).toLocaleDateString('ko-KR') : '';
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display='none'); document.body.style.overflow=''; }
function translateAuthError(code) {
  const m = { 'auth/user-not-found':'등록되지 않은 이메일입니다.','auth/wrong-password':'비밀번호가 틀렸습니다.','auth/invalid-email':'이메일 형식이 잘못되었습니다.','auth/email-already-in-use':'이미 사용 중인 이메일입니다.','auth/weak-password':'비밀번호는 6자 이상이어야 합니다.','auth/popup-closed-by-user':'로그인 창이 닫혔습니다.','auth/invalid-credential':'이메일 또는 비밀번호가 올바르지 않습니다.' };
  return m[code] || code;
}

// ── 공지사항 ──────────────────────────────────────────────────────────────────
async function loadNotices() {
  const list = document.getElementById('notice-list');
  list.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">불러오는 중...</p>';
  try {
    const snap = await getDocs(query(collection(db,'notices'), orderBy('createdAt','desc')));
    list.innerHTML = '';
    if (snap.empty) { list.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">등록된 공지사항이 없습니다.</p>'; return; }
    snap.forEach(d => {
      const data = d.data();
      const isNew = data.createdAt && (Date.now()-data.createdAt.toMillis() < 7*24*60*60*1000);
      const item = document.createElement('div');
      item.className = 'notice-item';
      item.innerHTML = `
        <span class="notice-badge${isNew?' new':''}">${isNew?'NEW':'공지'}</span>
        <span class="notice-title">${esc(data.title)}</span>
        <span class="notice-date">${fmtDate(data.createdAt)}</span>
        <button class="notice-del-btn" data-id="${d.id}" style="display:none">✕</button>`;
      list.appendChild(item);
    });
  } catch(e) { list.innerHTML = `<p style="padding:1rem 1.25rem;color:#dc2626;font-size:0.85rem;">오류: ${e.message}</p>`; }
  updateDelBtns();
}

async function updateDelBtns() {
  const ok = await checkAdmin(auth.currentUser);
  document.querySelectorAll('.notice-del-btn').forEach(b => b.style.display = ok ? 'inline-block' : 'none');
}

async function addNotice(title) {
  if (!title.trim()) return;
  if (!(await checkAdmin(auth.currentUser))) { toast('관리자만 등록할 수 있습니다.','error'); return; }
  await addDoc(collection(db,'notices'), { title:title.trim(), createdAt:serverTimestamp() });
  loadNotices();
  toast('공지사항이 등록되었습니다.','success');
}

async function deleteNotice(id) {
  if (!(await checkAdmin(auth.currentUser))) { toast('관리자만 삭제할 수 있습니다.','error'); return; }
  if (!confirm('공지사항을 삭제할까요?')) return;
  await deleteDoc(doc(db,'notices',id));
  loadNotices();
  if (document.getElementById('panel-notices').classList.contains('active')) loadConsoleNotices();
  toast('삭제되었습니다.','info');
}

// ── 사이트 배너 ───────────────────────────────────────────────────────────────
const BANNER_LS = 'astro_banner';

async function loadBanner() {
  try {
    const snap = await getDoc(doc(db,'config','site_banner'));
    if (!snap.exists() || !snap.data().active) return;
    const data = snap.data();
    const bid  = data.updatedAt ? String(data.updatedAt.toMillis()) : 'x';
    const stored = localStorage.getItem(`${BANNER_LS}_${bid}`);
    if (stored && Date.now() < parseInt(stored,10)) return;
    renderBanner(data, bid);
  } catch {}
}

function renderBanner(data, bid) {
  const el = document.getElementById('site-banner');
  const typeMap = { info:{cls:'banner-info',icon:'ℹ️'}, warning:{cls:'banner-warning',icon:'⚠️'}, danger:{cls:'banner-danger',icon:'🚨'} };
  const t = typeMap[data.type] || typeMap.info;
  el.className = t.cls;
  document.getElementById('banner-icon').textContent = t.icon;
  document.getElementById('banner-text').textContent = data.message;
  el.style.display = 'flex';
  document.getElementById('banner-dismiss-today').style.display = data.dismissible!==false ? 'inline' : 'none';
  document.getElementById('banner-dismiss-today').onclick = () => {
    const m = new Date(); m.setHours(23,59,59,999);
    localStorage.setItem(`${BANNER_LS}_${bid}`, String(m.getTime()));
    el.style.display = 'none';
  };
  document.getElementById('banner-close').onclick = () => { el.style.display='none'; };
}

async function saveBanner(data) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 배너를 설정할 수 있습니다.','error'); return; }
  await setDoc(doc(db,'config','site_banner'), { ...data, updatedAt:serverTimestamp() });
  toast('배너가 게시되었습니다.','success');
  loadBanner();
  refreshBannerInfo();
}

async function removeBanner() {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 배너를 제거할 수 있습니다.','error'); return; }
  if (!confirm('배너를 제거할까요?')) return;
  await setDoc(doc(db,'config','site_banner'), { active:false, updatedAt:serverTimestamp() });
  document.getElementById('site-banner').style.display = 'none';
  toast('배너가 제거되었습니다.','info');
  refreshBannerInfo();
}

async function refreshBannerInfo() {
  const el = document.getElementById('current-banner-info');
  if (!el) return;
  try {
    const snap = await getDoc(doc(db,'config','site_banner'));
    if (!snap.exists() || !snap.data().active) { el.innerHTML = '<span style="color:var(--gray);">현재 활성 배너 없음</span>'; return; }
    const d = snap.data();
    const labels = {info:'안내',warning:'경고',danger:'긴급'};
    el.innerHTML = `<strong>유형:</strong> ${labels[d.type]||d.type} &nbsp;|&nbsp; <strong>메시지:</strong> ${esc(d.message)} &nbsp;|&nbsp; <strong>오늘하루보지않기:</strong> ${d.dismissible!==false?'표시':'미표시'}`;
  } catch { el.textContent = '불러오기 실패'; }
}

// ── 관리자 관리 ───────────────────────────────────────────────────────────────
async function loadAdmins() {
  const el = document.getElementById('console-admin-list');
  el.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';
  const items = OWNER_EMAILS.map(e => ({ email:e, role:'owner' }));
  try {
    const snap = await getDocs(collection(db,'admins'));
    snap.forEach(d => { if (!OWNER_EMAILS.includes(d.id)) items.push({email:d.id,role:'admin'}); });
  } catch {}
  el.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <div class="admin-avatar${item.role==='owner'?' owner':''}">${item.email[0].toUpperCase()}</div>
      <div class="admin-info">
        <div class="admin-email">${esc(item.email)}</div>
        <div class="admin-role-sub">${item.role==='owner'?'모든 권한':'공지 CRUD'}</div>
      </div>
      <span class="role-badge ${item.role}">${item.role==='owner'?'운영담당자':'관리자'}</span>
      ${item.role==='admin'?`<button class="btn btn-xs btn-outline" style="color:var(--red);border-color:var(--red);" data-email="${esc(item.email)}">해제</button>`:''}`;
    el.appendChild(row);
  });
  el.querySelectorAll('[data-email]').forEach(b => b.addEventListener('click', () => revokeAdmin(b.dataset.email)));
}

async function addAdmin(email) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 관리자를 추가할 수 있습니다.','error'); return; }
  email = email.trim().toLowerCase();
  if (!email.includes('@')) { document.getElementById('admin-add-error').textContent='올바른 이메일 형식을 입력하세요.'; return; }
  if (OWNER_EMAILS.includes(email)) { document.getElementById('admin-add-error').textContent='운영담당자 이메일은 추가할 수 없습니다.'; return; }
  try {
    await setDoc(doc(db,'admins',email), { addedBy:auth.currentUser.email, addedAt:serverTimestamp() });
    _adminSet = null;
    document.getElementById('admin-add-error').textContent = '';
    document.getElementById('new-admin-email').value = '';
    toast(`${email} 을 관리자로 추가했습니다.`,'success');
    loadAdmins(); loadConsoleStats();
  } catch(e) { document.getElementById('admin-add-error').textContent='추가 실패: '+e.message; }
}

async function revokeAdmin(email) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 해제할 수 있습니다.','error'); return; }
  if (!confirm(`${email} 의 관리자 권한을 해제할까요?`)) return;
  try {
    await deleteDoc(doc(db,'admins',email));
    _adminSet = null;
    toast('관리자 권한이 해제되었습니다.','info');
    loadAdmins(); loadConsoleStats();
  } catch(e) { toast('해제 실패: '+e.message,'error'); }
}

// ── 질문 설정 ─────────────────────────────────────────────────────────────────
async function loadQuestions() {
  try {
    const snap = await getDoc(doc(db,'config','apply_questions'));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById('q1-input').value = d.q1 || '';
      document.getElementById('q2-input').value = d.q2 || '';
    }
  } catch {}
}

async function saveQuestions() {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 설정할 수 있습니다.','error'); return; }
  const q1 = document.getElementById('q1-input').value.trim();
  const q2 = document.getElementById('q2-input').value.trim();
  if (!q1 || !q2) { toast('질문 1, 2를 모두 입력해주세요.','error'); return; }
  try {
    await setDoc(doc(db,'config','apply_questions'), { q1, q2, updatedAt:serverTimestamp() });
    document.getElementById('questions-status').textContent = '✓ 저장되었습니다.';
    setTimeout(() => { document.getElementById('questions-status').textContent=''; }, 3000);
    toast('질문이 저장되었습니다.','success');
  } catch(e) { toast('저장 실패: '+e.message,'error'); }
}

// ── 콘솔 공지 목록 ────────────────────────────────────────────────────────────
async function loadConsoleNotices() {
  const el = document.getElementById('console-notice-list');
  el.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';
  try {
    const snap = await getDocs(query(collection(db,'notices'),orderBy('createdAt','desc')));
    if (snap.empty) { el.innerHTML='<div style="color:var(--gray);font-size:0.85rem;padding:0.5rem 0;">등록된 공지사항이 없습니다.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(d => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.85rem;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;';
      row.innerHTML = `<span style="flex:1;color:var(--ink);">${esc(d.data().title)}</span><span style="color:var(--gray);font-size:0.75rem;">${fmtDate(d.data().createdAt)}</span><button class="btn btn-xs btn-outline" style="color:var(--red);border-color:var(--red);" data-id="${d.id}">삭제</button>`;
      row.querySelector('button').addEventListener('click', () => deleteNotice(d.id));
      el.appendChild(row);
    });
  } catch(e) { el.innerHTML=`<div style="color:var(--red);font-size:0.85rem;">오류: ${e.message}</div>`; }
}

// ── 콘솔 통계 ─────────────────────────────────────────────────────────────────
async function loadConsoleStats() {
  try {
    const [ns, as, ads] = await Promise.all([
      getDocs(collection(db,'notices')),
      getDocs(collection(db,'applications')),
      getDocs(collection(db,'admins'))
    ]);
    document.getElementById('stat-notices').textContent    = ns.size;
    document.getElementById('stat-applicants').textContent = as.size;
    let pend = 0; as.forEach(d => { if ((d.data().status||'pending')==='pending') pend++; });
    document.getElementById('stat-pending').textContent = pend;
    const aEmails = new Set(ads.docs.map(d=>d.id).filter(e=>!OWNER_EMAILS.includes(e)));
    document.getElementById('stat-admins').textContent = aEmails.size;
  } catch {}
}

// ── 콘솔 탭 전환 ──────────────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.console-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===id));
  document.querySelectorAll('.console-panel').forEach(p => p.classList.toggle('active', p.id===`panel-${id}`));
  if (id==='admins') loadAdmins();
  if (id==='banner') refreshBannerInfo();
  if (id==='questions') loadQuestions();
  if (id==='notices') loadConsoleNotices();
  if (id==='overview') loadConsoleStats();
}
window.switchTab = switchTab;

// ── Auth 상태 ─────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  const loginBtn    = document.getElementById('login-btn');
  const menuWrap    = document.getElementById('user-menu-wrap');
  const userInfo    = document.getElementById('user-info');
  const adminPanel  = document.getElementById('admin-panel');
  const consoleBtn  = document.getElementById('open-console-btn');
  const consoleDiv  = document.getElementById('console-divider');

  if (user) {
    loginBtn.style.display = 'none';
    menuWrap.style.display = 'flex';
    const name = user.displayName || user.email;
    const owner = isOwner(user);
    const admin = await checkAdmin(user);
    userInfo.textContent = owner ? `👑 ${name}` : admin ? `💻 ${name}` : name;
    userInfo.style.display = 'inline';
    consoleBtn.style.display = owner ? 'block' : 'none';
    consoleDiv.style.display  = owner ? 'block' : 'none';
    if (adminPanel) adminPanel.style.display = admin ? 'block' : 'none';
  } else {
    loginBtn.style.display = 'inline-block';
    menuWrap.style.display = 'none';
    userInfo.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }
  updateDelBtns();
});

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  loadBanner();

  // 드롭다운
  const menuBtn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  menuBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
  document.addEventListener('click', () => dropdown.classList.remove('open'));

  // 로그인
  document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));

  // 로그아웃
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth); toast('로그아웃되었습니다.','info'); dropdown.classList.remove('open');
  });

  // 콘솔 열기
  document.getElementById('open-console-btn').addEventListener('click', () => {
    dropdown.classList.remove('open'); openModal('console-modal'); loadConsoleStats();
  });

  // 모달 닫기
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeAllModals));
  document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if(e.target===o) closeAllModals(); }));

  // 이메일 로그인
  document.getElementById('email-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('login-error');
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pw').value);
      closeAllModals(); toast('로그인되었습니다.','success');
    } catch(ex) { err.textContent = '로그인 실패: '+translateAuthError(ex.code); }
  });

  // 구글 로그인
  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try { await signInWithPopup(auth,gp); closeAllModals(); toast('Google 로그인 성공','success'); }
    catch(ex) { document.getElementById('login-error').textContent = translateAuthError(ex.code); }
  });

  // 회원가입 탭 전환
  document.getElementById('go-signup').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('login-tab').style.display='none'; document.getElementById('signup-tab').style.display='block'; document.getElementById('login-error').textContent='';
  });
  document.getElementById('go-login').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('signup-tab').style.display='none'; document.getElementById('login-tab').style.display='block';
  });

  // 회원가입
  document.getElementById('email-signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, document.getElementById('signup-email').value, document.getElementById('signup-pw').value);
      closeAllModals(); toast('가입이 완료되었습니다.','success');
    } catch(ex) { document.getElementById('signup-error').textContent='가입 실패: '+translateAuthError(ex.code); }
  });

  // 공지 추가 (관리자 패널)
  document.getElementById('notice-add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = document.getElementById('notice-input');
    const btn = e.submitter;
    btn.disabled=true; btn.textContent='저장 중...';
    await addNotice(inp.value);
    inp.value=''; btn.disabled=false; btn.textContent='등록';
  });

  // 공지 삭제 이벤트
  document.getElementById('notice-list').addEventListener('click', e => {
    const b = e.target.closest('.notice-del-btn');
    if (b) deleteNotice(b.dataset.id);
  });

  // 콘솔 탭 클릭
  document.querySelectorAll('.console-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // 관리자 추가
  document.getElementById('add-admin-btn').addEventListener('click', () => addAdmin(document.getElementById('new-admin-email').value));
  document.getElementById('new-admin-email').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();addAdmin(e.target.value);} });

  // 배너 유형
  document.querySelectorAll('.banner-type-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.banner-type-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); updateBannerPreview();
  }));
  document.getElementById('banner-msg-input').addEventListener('input', updateBannerPreview);

  function updateBannerPreview() {
    const msg = document.getElementById('banner-msg-input').value;
    const type = document.querySelector('.banner-type-btn.selected')?.dataset.type||'info';
    const prev = document.getElementById('banner-preview-box');
    const tm = {info:{cls:'banner-info',icon:'ℹ️'},warning:{cls:'banner-warning',icon:'⚠️'},danger:{cls:'banner-danger',icon:'🚨'}};
    if (msg.trim()) {
      prev.className = `banner-preview visible ${tm[type].cls}`;
      document.getElementById('preview-icon').textContent = tm[type].icon;
      document.getElementById('preview-text').textContent = msg;
    } else { prev.className = 'banner-preview'; }
  }

  document.getElementById('save-banner-btn').addEventListener('click', async () => {
    const msg = document.getElementById('banner-msg-input').value.trim();
    if (!msg) { toast('배너 메시지를 입력하세요.','error'); return; }
    await saveBanner({ active:true, message:msg, type:document.querySelector('.banner-type-btn.selected')?.dataset.type||'info', dismissible:document.getElementById('banner-dismissible').checked });
  });

  document.getElementById('remove-banner-btn').addEventListener('click', removeBanner);

  // 질문 저장
  document.getElementById('save-questions-btn').addEventListener('click', saveQuestions);

  // 콘솔 공지 추가
  const cni = document.getElementById('console-notice-input');
  document.getElementById('console-add-notice-btn').addEventListener('click', async () => {
    await addNotice(cni.value); cni.value=''; loadConsoleNotices(); loadConsoleStats();
  });
  cni.addEventListener('keydown', async e => {
    if (e.key==='Enter') { e.preventDefault(); await addNotice(cni.value); cni.value=''; loadConsoleNotices(); loadConsoleStats(); }
  });
});
