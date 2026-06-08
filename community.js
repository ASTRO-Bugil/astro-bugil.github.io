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

// ── 관리자 권한 확인 ──────────────────────────────────────────────────────────
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

// ── 이름/이메일 마스킹 (맨 뒷글자도 모자이크 적용) ─────────────────────────────────
function maskName(nameOrEmail) {
  if (!nameOrEmail) return '익명';
  
  if (nameOrEmail.includes('@')) {
    const local = nameOrEmail.split('@')[0];
    if (local.length <= 1) return local + '*';
    const first = local.charAt(0);
    const stars = '*'.repeat(Math.min(local.length - 1, 8));
    return first + stars;
  }
  if (nameOrEmail.length === 1) return nameOrEmail;
  
  const first = nameOrEmail.charAt(0);
  const stars = '*'.repeat(nameOrEmail.length - 1);
  return first + stars;
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
  if(!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function openModal(id)  { const el=document.getElementById(id); if(el){ el.style.display='flex'; document.body.style.overflow='hidden'; } }
function closeModal(id) { const el=document.getElementById(id); if(el){ el.style.display='none'; document.body.style.overflow=''; } }
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
let isAdminUser = false;
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const PAGE_SIZE = 15;
let currentPostId = null;

// ── 게시글 로드 ───────────────────────────────────────────────────────────────
async function loadPosts() {
  const tbody = document.getElementById('board-tbody');
  if(!tbody) return;
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
  const searchInput = document.getElementById('search-input');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let posts = q ? allPosts.filter(p => p.title.toLowerCase().includes(q)) : [...allPosts];
  
  posts.sort((a, b) => {
    const aNotice = a.isNotice ? 1 : 0;
    const bNotice = b.isNotice ? 1 : 0;
    if (aNotice !== bNotice) return bNotice - aNotice;
    return 0; 
  });
  
  filteredPosts = posts;
  currentPage = 1;
  renderBoard();
}

function renderBoard() {
  const tbody = document.getElementById('board-tbody');
  const countEl = document.getElementById('board-count');
  if (countEl) countEl.textContent = `전체 ${filteredPosts.length}개`;
  
  if (!filteredPosts.length) {
    if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="board-empty">게시글이 없습니다.</td></tr>';
    const pageEl = document.getElementById('pagination');
    if(pageEl) pageEl.innerHTML = '';
    return;
  }
  
  const noticeCount = filteredPosts.filter(p => p.isNotice).length;
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredPosts.slice(start, start + PAGE_SIZE);
  if(tbody) tbody.innerHTML = '';
  
  page.forEach((post, i) => {
    const absoluteIndex = start + i;
    const isNew = post.createdAt && (Date.now() - post.createdAt.toMillis() < 24*60*60*1000);
    const displayName = post.authorName || post.authorEmail;
    
    let numStr = '';
    if (post.isNotice) {
      numStr = '<span class="badge-notice">공지</span>';
    } else {
      const normalIndex = absoluteIndex - noticeCount;
      numStr = (filteredPosts.length - noticeCount) - normalIndex;
    }
    const tr = document.createElement('tr');
    if (post.isNotice) tr.className = 'row-notice';
    tr.innerHTML = `
      <td class="col-num">${numStr}</td>
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
    if(tbody) tbody.appendChild(tr);
  });
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const el = document.getElementById('pagination');
  if (!el) return;
  if (total <= 1) { el.innerHTML = ''; return; }
  
  let html = `<button class="page-btn" ${currentPage===1?'disabled':''} onclick="gotoPage(${currentPage-1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i !== 1 && i !== total && (i < currentPage-2 || i > currentPage+2)) {
      if (i === currentPage-3 || i === currentPage+3) html += `<span class="page-dots">...</span>`;
      continue;
    }
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="gotoPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage===total?'disabled':''} onclick="gotoPage(${currentPage+1})">›</button>`;
  el.innerHTML = html;
}

window.gotoPage = function(page) {
  const total = Math.ceil(filteredPosts.length / PAGE_SIZE);
  if (page >= 1 && page <= total) {
    currentPage = page;
    renderBoard();
  }
};

// ── 게시글 읽기/상세 ─────────────────────────────────────────────────────────
async function openPost(postId) {
  currentPostId = postId;
  try {
    // 조회수 증가 로직
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, { views: increment(1) });
    
    const snap = await getDoc(postRef);
    if (!snap.exists()) { toast('게시글이 존재하지 않습니다.', 'error'); return; }
    
    const data = snap.data();
    document.getElementById('post-view-title').textContent = data.title;
    const authorStr = maskName(data.authorName || data.authorEmail);
    document.getElementById('post-view-info').textContent = `작성자: ${authorStr} | 작성일: ${fmtDateFull(data.createdAt)} | 조회수: ${data.views + 1 || 1}`;
    document.getElementById('post-view-content').innerHTML = esc(data.content).replace(/\n/g, '<br>');
    
    // 작성자 본인 또는 관리자만 삭제 가능
    const isAuthor = currentUser && (currentUser.email === data.authorEmail);
    document.getElementById('btn-delete-post').style.display = (isAuthor || isAdminUser) ? 'inline-block' : 'none';
    
    loadComments(postId);
    openModal('post-view-modal');
  } catch(e) {
    toast('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
  }
}

async function deletePost() {
  if (!currentPostId) return;
  if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
  try {
    await deleteDoc(doc(db, 'community_posts', currentPostId));
    toast('게시글이 삭제되었습니다.', 'success');
    closeModal('post-view-modal');
    loadPosts();
  } catch(e) {
    toast('삭제 실패: ' + e.message, 'error');
  }
}

// ── 게시글 쓰기 ──────────────────────────────────────────────────────────────
async function savePost(e) {
  e.preventDefault();
  if (!currentUser) { toast('로그인이 필요합니다.', 'error'); return; }
  
  const title = document.getElementById('write-title').value.trim();
  const content = document.getElementById('write-content').value.trim();
  const isNoticeEl = document.getElementById('write-is-notice');
  const isNotice = isNoticeEl ? isNoticeEl.checked : false;

  if (!title || !content) { toast('제목과 내용을 모두 입력해주세요.', 'error'); return; }

  const btn = document.getElementById('btn-save-post');
  btn.disabled = true;
  btn.textContent = '등록 중...';

  try {
    await addDoc(collection(db, 'community_posts'), {
      title,
      content,
      authorEmail: currentUser.email,
      authorName: currentUser.displayName || currentUser.email.split('@')[0],
      createdAt: serverTimestamp(),
      views: 0,
      isNotice: isAdminUser ? isNotice : false
    });
    toast('게시글이 등록되었습니다.', 'success');
    closeModal('write-modal');
    document.getElementById('write-form').reset();
    loadPosts();
  } catch(err) {
    toast('등록 실패: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '등록';
  }
}

// ── 댓글 관리 ─────────────────────────────────────────────────────────────────
async function loadComments(postId) {
  const cList = document.getElementById('comment-list');
  cList.innerHTML = '<div style="font-size:0.85rem; color:var(--gray);">댓글 불러오는 중...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'community_posts', postId, 'comments'), orderBy('createdAt', 'asc')));
    cList.innerHTML = '';
    if (snap.empty) {
      cList.innerHTML = '<div style="font-size:0.85rem; color:var(--gray);">댓글이 없습니다.</div>';
      return;
    }
    
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.className = 'comment-item';
      
      const isCmtAuthor = currentUser && (currentUser.email === data.authorEmail);
      const delBtnHtml = (isCmtAuthor || isAdminUser) ? `<button class="btn-del-cmt" data-id="${d.id}">✕</button>` : '';
      
      div.innerHTML = `
        <div class="cmt-header">
          <strong>${esc(maskName(data.authorName || data.authorEmail))}</strong>
          <span class="cmt-date">${fmtDateFull(data.createdAt)}</span>
          ${delBtnHtml}
        </div>
        <div class="cmt-body">${esc(data.content).replace(/\n/g, '<br>')}</div>
      `;
      cList.appendChild(div);
    });

    // 댓글 삭제 이벤트 바인딩
    cList.querySelectorAll('.btn-del-cmt').forEach(btn => {
      btn.addEventListener('click', () => deleteComment(postId, btn.dataset.id));
    });

  } catch(e) {
    cList.innerHTML = `<div style="color:var(--red);">댓글 오류: ${esc(e.message)}</div>`;
  }
}

async function addComment(e) {
  e.preventDefault();
  if (!currentUser) { toast('로그인이 필요합니다.', 'error'); return; }
  if (!currentPostId) return;

  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;

  const btn = document.getElementById('btn-add-comment');
  btn.disabled = true;

  try {
    await addDoc(collection(db, 'community_posts', currentPostId, 'comments'), {
      content,
      authorEmail: currentUser.email,
      authorName: currentUser.displayName || currentUser.email.split('@')[0],
      createdAt: serverTimestamp()
    });
    input.value = '';
    loadComments(currentPostId);
    // 캐시된 목록에서 댓글 수 업데이트(UI상 즉시 반영을 위함)
    const pTarget = allPosts.find(p => p.id === currentPostId);
    if(pTarget) pTarget.commentCount += 1;
    renderBoard();
  } catch(err) {
    toast('댓글 등록 실패: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteComment(postId, commentId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  try {
    await deleteDoc(doc(db, 'community_posts', postId, 'comments', commentId));
    loadComments(postId);
    const pTarget = allPosts.find(p => p.id === postId);
    if(pTarget && pTarget.commentCount > 0) pTarget.commentCount -= 1;
    renderBoard();
    toast('댓글이 삭제되었습니다.', 'info');
  } catch(e) {
    toast('삭제 실패: ' + e.message, 'error');
  }
}

// ── 인증 상태 리스너 ──────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  currentUser = user;
  isAdminUser = await checkAdmin(user);
  
  const writeBtn = document.getElementById('btn-open-write');
  if (writeBtn) writeBtn.style.display = user ? 'inline-block' : 'none';
  
  const noticeWrapper = document.getElementById('write-notice-wrapper');
  if (noticeWrapper) noticeWrapper.style.display = isAdminUser ? 'flex' : 'none';
  
  // 로그인 안 된 경우 댓글 창 비활성화/UI 변경 등 처리
  const commentInput = document.getElementById('comment-input');
  const commentBtn = document.getElementById('btn-add-comment');
  if (commentInput && commentBtn) {
    if (user) {
      commentInput.placeholder = "댓글을 입력하세요...";
      commentInput.disabled = false;
      commentBtn.disabled = false;
    } else {
      commentInput.placeholder = "로그인 후 댓글을 작성할 수 있습니다.";
      commentInput.disabled = true;
      commentBtn.disabled = true;
    }
  }
});

// ── 초기화 및 이벤트 리스너 바인딩 ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyFilter();
    });
  }
  
  const searchBtn = document.getElementById('btn-search');
  if (searchBtn) searchBtn.addEventListener('click', applyFilter);
  
  const writeBtn = document.getElementById('btn-open-write');
  if (writeBtn) writeBtn.addEventListener('click', () => {
    document.getElementById('write-form').reset();
    openModal('write-modal');
  });

  const writeForm = document.getElementById('write-form');
  if (writeForm) writeForm.addEventListener('submit', savePost);

  const commentForm = document.getElementById('comment-form');
  if (commentForm) commentForm.addEventListener('submit', addComment);

  const delPostBtn = document.getElementById('btn-delete-post');
  if (delPostBtn) delPostBtn.addEventListener('click', deletePost);

  // 모달 닫기 공통
  document.querySelectorAll('.modal-close').forEach(b => {
    b.addEventListener('click', () => {
      b.closest('.modal-overlay').style.display = 'none';
      document.body.style.overflow = '';
    });
  });
  
  // 모달 배경 클릭 시 닫기
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
      if (e.target === o) {
        o.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  });
});
