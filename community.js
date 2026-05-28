import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, getDoc, updateDoc, query, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
const db   = getFirestore(app);
const gp   = new GoogleAuthProvider();

const OWNER_EMAILS = ['yunthomas0120@gmail.com', 'yunarchive0120@gmail.com'];
function isOwner(u) { return !!u && OWNER_EMAILS.includes(u.email); }

// ── 이름/이메일 마스킹 (이름 우선 처리) ──────────────────────────────────────────
function maskName(nameOrEmail) {
  if (!nameOrEmail) return '익명';
  
  // displayName이 설정되지 않아 이메일이 넘어온 경우
  if (nameOrEmail.includes('@')) {
    const local = nameOrEmail.split('@')[0];
    if (local.length <= 2) return local.charAt(0) + '*';
    const first = local.charAt(0);
    const last = local.slice(-1);
    const stars = '*'.repeat(Math.min(local.length - 2, 5));
    return `${first}${stars}${last}`;
  }

  // 일반 이름인 경우 (예: 홍길동 -> 홍*동)
  if (nameOrEmail.length === 1) return nameOrEmail;
  if (nameOrEmail.length === 2) return nameOrEmail.charAt(0) + '*';
  
  const first = nameOrEmail.charAt(0);
  const last = nameOrEmail.slice(-1);
  const middle = '*'.repeat(nameOrEmail.length - 2);
  
  return first + middle + last;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts.toMillis()), now = new Date(), diff = now - d;
  if (diff < 60000)    return '방금 전';
  if (diff < 3600000)  return `${Math.floor(diff/60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}시간 전`;
  return d.toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'});
}
function fmtDateFull(ts) {
  if (!ts) return '';
  return new Date(ts.toMillis()).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function toast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function openModal(id)  { document.getElementById(id).style.display='flex'; document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).style.display='none'; document.body.style.overflow=''; }

function translateAuthError(code) {
  const m = {
    'auth/user-not-found':'등록되지 않은 이메일입니다.',
    'auth/wrong-password':'비밀번호가 틀렸습니다.',
    'auth/invalid-email':'이메일 형식이 잘못되었습니다.',
    'auth/email-already-in-use':'이미 사용 중인 이메일입니다.',
    'auth/weak-password':'비밀번호는 6자 이상이어야 합니다.',
    'auth/popup-closed-by-user':'로그인 창이 닫혔습니다.',
    'auth/invalid-credential':'이메일 또는 비밀번호가 올바르지 않습니다.'
  };
  return m[code] || code;
}

// ── 상태 ──────────────────────────────────────────────────────────────────────
let currentUser = null;
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const PAGE_SIZE = 15;
let currentPostId = null;

// ── 게시글 로드 ───────────────────────────────────────────────────────────────
async function loadPosts() {
  const tbody = document.getElementById('board-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="board-empty">불러오는 중...</td></tr>';
  try {
    const snap = await getDocs(query(collection(db,'community_posts'), orderBy('createdAt','desc')));
    const ccArr = await Promise.all(snap.docs.map(async d => {
      try { const cs = await getDocs(collection(db,'community_posts',d.id,'comments')); return [d.id, cs.size]; }
      catch { return [d.id, 0]; }
    }));
    const ccMap = Object.fromEntries(ccArr);
    allPosts = snap.docs.map(d => ({ id:d.id, ...d.data(), commentCount: ccMap[d.id]||0 }));
    applyFilter();
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" class="board-empty" style="color:var(--red);">불러오기 실패: ${esc(e.message)}</td></tr>`;
  }
}

function applyFilter() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filteredPosts = q ? allPosts.filter(p => p.title.toLowerCase().includes(q)) : [...allPosts];
  currentPage = 1;
  renderBoard();
}

function renderBoard() {
  const tbody = document.getElementById('board-tbody');
  document.getElementById('board-count').textContent = `전체 ${filteredPosts.length}개`;
  if (!filteredPosts.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="board-empty">게시글이 없습니다.</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredPosts.slice(start, start + PAGE_SIZE);
  tbody.innerHTML = '';
  page.forEach((post, i) => {
    const num  = filteredPosts.length - start - i;
    const isNew = post.createdAt && (Date.now() - post.createdAt.toMillis() < 24*60*60*1000);
    // authorName이 있으면 사용하고, 없으면 authorEmail 사용
    const displayName = post.authorName || post.authorEmail;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-num">${num}</td>
      <td class="col-title">
        <div class="post-title-cell">
          <span class="post-title-text">${esc(post.title)}</span>
          ${isNew ? '<span class="badge-new">N</span>' : ''}
        </div>
      </td>
      <td class="col-author">${esc(maskName(displayName))}</td>
      <td class="col-date">${fmtDate(post.createdAt)}</td>
      <td class="col-views">${post.views || 0}</td>
      <td class="col-comments">${post.commentCount > 0 ? post.commentCount : ''}</td>`;
    tr.addEventListener('click', () => openPost(post.id));
    tbody.appendChild(tr);
  });
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${currentPage===1?'disabled':''} onclick="gotoPage(${currentPage-1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i !== 1 && i !== total && (i < currentPage-2 || i > currentPage+2)) {
      if (i === currentPage-3 || i === currentPage+3) html += `<span style="color:var(--gray);padding:0 4px;line-height:34px;">…</span>`;
      continue;
    }
    html += `<button class="page-btn${i===currentPage?' active':''}" onclick="gotoPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage===total?'disabled':''} onclick="gotoPage(${currentPage+1})">›</button>`;
  el.innerHTML = html;
}
window.gotoPage = p => { currentPage = p; renderBoard(); window.scrollTo({top:0,behavior:'smooth'}); };

// ── 게시글 전체 삭제 (관리자 전용) ───────────────────────────────────────────
async function deleteAllPosts() {
  if (!isOwner(currentUser)) {
    toast('운영담당자만 접근할 수 있습니다.', 'error');
    return;
  }
  
  if (!confirm('🚨 경고: 정말로 모든 게시글과 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    return;
  }

  const btn = document.getElementById('delete-all-btn');
  btn.disabled = true;
  btn.textContent = '삭제 진행 중...';

  try {
    const snap = await getDocs(collection(db, 'community_posts'));
    
    // 모든 게시글을 순회하며 하위 댓글까지 모두 삭제
    for (const docSnap of snap.docs) {
      const postId = docSnap.id;
      const commentsSnap = await getDocs(collection(db, 'community_posts', postId, 'comments'));
      
      for (const commentSnap of commentsSnap.docs) {
        await deleteDoc(commentSnap.ref);
      }
      await deleteDoc(docSnap.ref);
    }
    
    toast('모든 게시글이 삭제되었습니다.', 'success');
    loadPosts();
  } catch (error) {
    toast('전체 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚨 전체 삭제';
  }
}

// ── 글 열기 ───────────────────────────────────────────────────────────────────
async function openPost(postId) {
  currentPostId = postId;
  try { await updateDoc(doc(db,'community_posts',postId), { views: increment(1) }); } catch {}
  try {
    const snap = await getDoc(doc(db,'community_posts',postId));
    if (!snap.exists()) { toast('삭제된 글입니다.','error'); return; }
    const data = snap.data();
    const displayName = data.authorName || data.authorEmail;
    
    document.getElementById('view-title').textContent   = data.title;
    document.getElementById('view-author').textContent  = maskName(displayName);
    document.getElementById('view-date').textContent    = fmtDateFull(data.createdAt);
    document.getElementById('view-views').textContent   = ((data.views||0)+1) + ' 조회';
    document.getElementById('view-content').textContent = data.content;
    
    // 운영담당자 삭제 버튼
    const footer = document.getElementById('view-footer-actions');
    footer.innerHTML = '';
    if (isOwner(currentUser)) {
      const b = document.createElement('button');
      b.className = 'btn btn-danger btn-sm';
      b.textContent = '🗑️ 글 삭제';
      b.addEventListener('click', () => deletePost(postId));
      footer.appendChild(b);
    }
    openModal('view-modal');
    loadComments(postId);
  } catch(e) { toast('글을 불러올 수 없습니다: '+e.message,'error'); }
}

async function deletePost(postId) {
  if (!isOwner(currentUser)) { toast('운영담당자만 삭제할 수 있습니다.','error'); return; }
  if (!confirm('이 글을 삭제할까요? 댓글도 함께 삭제됩니다.')) return;
  try {
    const cs = await getDocs(collection(db,'community_posts',postId,'comments'));
    await Promise.all(cs.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db,'community_posts',postId));
    closeModal('view-modal');
    toast('글이 삭제되었습니다.','info');
    loadPosts();
  } catch(e) { toast('삭제 실패: '+e.message,'error'); }
}

// ── 댓글 ──────────────────────────────────────────────────────────────────────
async function loadComments(postId) {
  const list = document.getElementById('comment-list');
  const titleEl = document.getElementById('comments-title');
  const writeArea = document.getElementById('comment-write-area');
  list.innerHTML = '<div class="comment-empty">불러오는 중...</div>';
  try {
    const snap = await getDocs(query(collection(db,'community_posts',postId,'comments'), orderBy('createdAt','asc')));
    titleEl.textContent = `댓글 ${snap.size}개`;
    list.innerHTML = '';
    if (snap.empty) {
      list.innerHTML = '<div class="comment-empty">첫 댓글을 남겨보세요!</div>';
    } else {
      snap.forEach(d => {
        const data = d.data();
        const item = document.createElement('div');
        item.className = 'comment-item';
        
        const displayName = data.authorName || data.authorEmail;
        const initial = (displayName?.[0]||'?').toUpperCase();
        
        item.innerHTML = `
          <div class="comment-avatar">${initial}</div>
          <div class="comment-main">
            <div class="comment-author">${esc(maskName(displayName))}</div>
            <div class="comment-text">${esc(data.content)}</div>
            <div class="comment-date">${fmtDateFull(data.createdAt)}</div>
          </div>
          ${isOwner(currentUser) ? `<button class="comment-del-btn" data-cid="${d.id}" title="삭제">✕</button>` : ''}`;
        item.querySelectorAll('[data-cid]').forEach(b =>
          b.addEventListener('click', () => deleteComment(postId, b.dataset.cid))
        );
        list.appendChild(item);
      });
    }
  } catch(e) { list.innerHTML = `<div class="comment-empty" style="color:var(--red);">오류: ${e.message}</div>`; }

  // 댓글 작성 영역
  writeArea.innerHTML = '';
  if (currentUser) {
    const row = document.createElement('div');
    row.className = 'comment-write';
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'comment-input';
    inp.placeholder = '댓글을 입력하세요...'; inp.maxLength = 300;
    const btn = document.createElement('button');
    btn.className = 'btn btn-blue btn-sm';
    btn.textContent = '등록';
    btn.addEventListener('click', async () => {
      const val = inp.value.trim();
      if (!val) return;
      btn.disabled = true;
      try {
        await addDoc(collection(db,'community_posts',postId,'comments'), {
          content: val, authorEmail: currentUser.email,
          authorName: currentUser.displayName || '', 
          createdAt: serverTimestamp()
        });
        inp.value = '';
        loadComments(postId);
      } catch(e) { toast('댓글 등록 실패: '+e.message,'error'); }
      btn.disabled = false;
    });
    inp.addEventListener('keydown', e => { if(e.key==='Enter') btn.click(); });
    row.appendChild(inp); row.appendChild(btn);
    writeArea.appendChild(row);
  } else {
    writeArea.innerHTML = '<div class="comment-login-notice">💬 댓글을 달려면 <a href="#" id="cmt-login-link" style="color:var(--blue);text-decoration:none;font-weight:500;">로그인</a>이 필요합니다.</div>';
    document.getElementById('cmt-login-link')?.addEventListener('click', e => {
      e.preventDefault(); closeModal('view-modal'); openModal('login-modal');
    });
  }
}

async function deleteComment(postId, cid) {
  if (!isOwner(currentUser)) { toast('운영담당자만 삭제할 수 있습니다.','error'); return; }
  if (!confirm('댓글을 삭제할까요?')) return;
  try {
    await deleteDoc(doc(db,'community_posts',postId,'comments',cid));
    loadComments(postId);
    toast('댓글이 삭제되었습니다.','info');
  } catch(e) { toast('삭제 실패: '+e.message,'error'); }
}

// ── 글 작성 ───────────────────────────────────────────────────────────────────
async function submitPost() {
  if (!currentUser) { toast('로그인이 필요합니다.','error'); return; }
  const title   = document.getElementById('post-title-input').value.trim();
  const content = document.getElementById('post-content-input').value.trim();
  if (!title)   { toast('제목을 입력해주세요.','error'); return; }
  if (!content) { toast('내용을 입력해주세요.','error'); return; }
  const btn = document.getElementById('post-submit-btn');
  btn.disabled = true; btn.textContent = '저장 중...';
  try {
    await addDoc(collection(db,'community_posts'), {
      title, content, authorEmail: currentUser.email,
      authorName: currentUser.displayName || '',
      createdAt: serverTimestamp(), views: 0
    });
    closeModal('write-modal');
    document.getElementById('post-title-input').value = '';
    document.getElementById('post-content-input').value = '';
    toast('글이 등록되었습니다.','success');
    loadPosts();
  } catch(e) { toast('등록 실패: '+e.message,'error'); }
  btn.disabled = false; btn.textContent = '게시하기';
}

// ── Auth 상태 ─────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  currentUser = user;
  const loginBtn  = document.getElementById('login-btn');
  const menuWrap  = document.getElementById('user-menu-wrap');
  const userInfo  = document.getElementById('user-info');
  const writeBtn  = document.getElementById('write-btn');
  const writeBtnL = document.getElementById('write-btn-login');
  const deleteAllBtn = document.getElementById('delete-all-btn');

  if (user) {
    loginBtn.style.display  = 'none';
    menuWrap.style.display  = 'flex';
    userInfo.textContent    = isOwner(user) ? `👑 ${user.displayName||user.email}` : (user.displayName||user.email);
    userInfo.style.display  = 'inline';
    writeBtn.style.display  = 'inline-block';
    writeBtnL.style.display = 'none';
    
    // 운영담당자일 경우 전체 삭제 버튼 표시
    if (isOwner(user)) {
      deleteAllBtn.style.display = 'inline-block';
    } else {
      deleteAllBtn.style.display = 'none';
    }
  } else {
    loginBtn.style.display  = 'inline-block';
    menuWrap.style.display  = 'none';
    userInfo.style.display  = 'none';
    writeBtn.style.display  = 'none';
    writeBtnL.style.display = 'inline-block';
    deleteAllBtn.style.display = 'none';
  }
  
  if (currentPostId && document.getElementById('view-modal').style.display === 'flex') {
    loadComments(currentPostId);
  }
});

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadPosts();

  // 검색
  let st;
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(st); st = setTimeout(applyFilter, 300);
  });

  // 버튼 이벤트
  document.getElementById('write-btn').addEventListener('click', () => openModal('write-modal'));
  document.getElementById('write-btn-login').addEventListener('click', () => openModal('login-modal'));
  document.getElementById('post-submit-btn').addEventListener('click', submitPost);
  document.getElementById('delete-all-btn').addEventListener('click', deleteAllPosts);

  // 모달 닫기
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.close;
      closeModal(id);
      if (id === 'view-modal') currentPostId = null;
    });
  });
  
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
      if (e.target !== o) return;
      const id = o.id;
      closeModal(id);
      if (id === 'view-modal') currentPostId = null;
    });
  });

  // 드롭다운
  const dropdown = document.getElementById('user-dropdown');
  document.getElementById('user-menu-btn').addEventListener('click', e => {
    e.stopPropagation(); dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));

  // 인증
  document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth); toast('로그아웃되었습니다.','info'); dropdown.classList.remove('open');
  });

  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try { await signInWithPopup(auth,gp); closeModal('login-modal'); toast('Google 로그인 성공','success'); }
    catch(ex) { document.getElementById('login-error').textContent = translateAuthError(ex.code); }
  });

  document.getElementById('email-login-btn').addEventListener('click', async () => {
    const err = document.getElementById('login-error');
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pw').value);
      closeModal('login-modal'); toast('로그인되었습니다.','success');
    } catch(ex) { err.textContent = '로그인 실패: '+translateAuthError(ex.code); }
  });
  document.getElementById('login-pw').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('email-login-btn').click(); });

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

  document.getElementById('email-signup-btn').addEventListener('click', async () => {
    try {
      await createUserWithEmailAndPassword(auth, document.getElementById('signup-email').value, document.getElementById('signup-pw').value);
      closeModal('login-modal'); toast('가입이 완료되었습니다.','success');
    } catch(ex) { document.getElementById('signup-error').textContent = '가입 실패: '+translateAuthError(ex.code); }
  });
});
