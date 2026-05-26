// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 사용자 Firebase Config
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

// ★ 관리자 이메일 설정 ★
const ADMIN_EMAIL = "yunthomas0120@gmail.com"; 

function isAdmin(user) {
  return !!user && user.email === ADMIN_EMAIL;
}

// 모달 제어 유틸 함수
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  document.body.style.overflow = '';
}

// 에러 메시지 한글화 함수
function translateAuthError(code) {
  const map = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 틀렸습니다.',
    'auth/invalid-email': '이메일 형식이 잘못되었습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
    'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  };
  return map[code] || code;
}

// DOM 요소 
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const adminPanel = document.getElementById('admin-panel');
const noticeList = document.getElementById('notice-list');
const noticeInput = document.getElementById('notice-input');

// Auth 상태 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    
    const label = isAdmin(user) ? '👑 ' + user.email : (user.displayName || user.email.split('@')[0]);
    userInfo.textContent = label;
    userInfo.style.display = 'inline-block';
    
    if (adminPanel) adminPanel.style.display = isAdmin(user) ? 'block' : 'none';
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userInfo.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }
});

// 이벤트 바인딩 (DOM 로드 후)
window.addEventListener('DOMContentLoaded', () => {
  loadNotices();

  /* 로그인 버튼 -> 모달 열기 */
  loginBtn.addEventListener('click', () => openModal('login-modal'));
  logoutBtn.addEventListener('click', () => signOut(auth));

  /* 모달 닫기 이벤트 */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeAllModals());
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAllModals(); });
  });

  /* 탭 전환 로직 */
  document.getElementById('go-signup').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-tab').style.display = 'none';
    document.getElementById('signup-tab').style.display = 'block';
    document.getElementById('login-error').textContent = '';
  });
  
  document.getElementById('go-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('signup-tab').style.display = 'none';
    document.getElementById('login-tab').style.display = 'block';
    document.getElementById('signup-error').textContent = '';
  });

  /* 이메일 로그인 */
  document.getElementById('email-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pw = document.getElementById('login-pw').value;
    const err = document.getElementById('login-error');
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      closeAllModals();
      e.target.reset();
    } catch(ex) {
      err.textContent = '로그인 실패: ' + translateAuthError(ex.code);
    }
  });

  /* 이메일 회원가입 */
  document.getElementById('email-signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const pw = document.getElementById('signup-pw').value;
    const err = document.getElementById('signup-error');
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
      closeAllModals();
      e.target.reset();
    } catch(ex) {
      err.textContent = '가입 실패: ' + translateAuthError(ex.code);
    }
  });

  /* 구글 로그인 */
  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      closeAllModals();
    } catch(ex) {
      document.getElementById('login-error').textContent = translateAuthError(ex.code);
    }
  });

  /* 공지사항 작성 (관리자 전용) */
  document.getElementById('submit-notice-btn').addEventListener('click', async (e) => {
    const title = noticeInput.value.trim();
    if (!title) return alert("공지사항 제목을 입력해주세요.");
    
    if (!isAdmin(auth.currentUser)) return alert('관리자만 공지사항을 등록할 수 있습니다.');
    
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = '저장 중...';
    
    try {
      await addDoc(collection(db, 'notices'), {
        title: title,
        createdAt: serverTimestamp()
      });
      noticeInput.value = '';
      loadNotices();
    } catch(ex) {
      alert('저장 실패: ' + ex.message);
    }
    btn.disabled = false;
    btn.textContent = '등록';
  });
});

/* 공지사항 불러오기 및 렌더링 */
async function loadNotices() {
  noticeList.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">불러오는 중...</p>';
  try {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    noticeList.innerHTML = '';
    
    if (snap.empty) {
      noticeList.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">등록된 공지사항이 없습니다.</p>';
      return;
    }
    
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ko-KR') : '방금 전';
      
      // 일주일 이내 글이면 NEW 뱃지 표시
      const isNew = data.createdAt && (Date.now() - data.createdAt.toMillis() < 7 * 24 * 60 * 60 * 1000);
      
      const itemHTML = `
        <div class="notice-item">
          <span class="notice-badge${isNew ? ' new' : ''}">${isNew ? 'NEW' : '공지'}</span>
          <span class="notice-title">${data.title.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
          <span class="notice-date">${dateStr}</span>
        </div>
      `;
      noticeList.insertAdjacentHTML('beforeend', itemHTML);
    });
  } catch(e) {
    noticeList.innerHTML = '<p style="padding:1rem 1.25rem;color:#dc2626;font-size:0.85rem;">불러오기 실패: ' + e.message + '</p>';
  }
}
