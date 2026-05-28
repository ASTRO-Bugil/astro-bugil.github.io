import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, 
  query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase 초기화 (main.js와 동일) ─────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain:        "astro-bugil-a1dd7.firebaseapp.com",
  projectId:         "astro-bugil-a1dd7",
  storageBucket:     "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId:             "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId:     "G-21GJSVVG2G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── 이름 모자이크(마스킹) 로직 ───────────────────────────────
function maskName(name) {
  if (!name) return "익명";

  // 만약 구글 로그인이 아닌 이메일 로그인이라 displayName이 이메일 형식일 경우
  if (name.includes("@")) {
    const [id, domain] = name.split("@");
    if (id.length <= 2) return id.charAt(0) + "*@" + domain;
    return id.charAt(0) + "*".repeat(id.length - 2) + id.slice(-1) + "@" + domain;
  }

  // 일반 이름 (예: 홍길동 -> 홍*동, 남궁민수 -> 남**수)
  if (name.length === 1) return name;
  if (name.length === 2) return name.charAt(0) + "*";
  
  const first = name.charAt(0);
  const last = name.slice(-1);
  const middle = "*".repeat(name.length - 2);
  
  return first + middle + last;
}

// ── 유틸리티 ───────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(ts) {
  if (!ts) return '방금 전';
  const date = new Date(ts.toMillis());
  return date.toLocaleString('ko-KR', { 
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

// ── 게시글 불러오기 ──────────────────────────────────────────
async function loadPosts() {
  const listEl = document.getElementById('community-list');
  listEl.innerHTML = '<p style="text-align:center; color:var(--gray); padding: 2rem;">게시글을 불러오는 중입니다...</p>';

  try {
    const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    
    listEl.innerHTML = '';
    
    if (snap.empty) {
      listEl.innerHTML = '<p style="text-align:center; color:var(--gray); padding: 2rem;">첫 번째 게시글을 작성해 보세요!</p>';
      return;
    }

    snap.forEach(doc => {
      const data = doc.data();
      const maskedName = maskName(data.authorName);
      
      const card = document.createElement('div');
      card.className = 'post-card';
      card.innerHTML = `
        <div class="post-header">
          <div class="post-author">
            <div class="post-author-avatar">${maskedName.charAt(0)}</div>
            ${esc(maskedName)}
          </div>
          <div class="post-date">${fmtDate(data.createdAt)}</div>
        </div>
        <div class="post-content">${esc(data.content)}</div>
      `;
      listEl.appendChild(card);
    });
  } catch (error) {
    listEl.innerHTML = `<p style="color:var(--red); text-align:center;">불러오기 실패: ${error.message}</p>`;
  }
}

// ── 게시글 등록 ──────────────────────────────────────────────
async function submitPost(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const contentInput = document.getElementById('post-content');
  const btn = document.getElementById('submit-post-btn');
  const content = contentInput.value.trim();

  if (!content) return;

  btn.disabled = true;
  btn.textContent = '등록 중...';

  try {
    await addDoc(collection(db, 'community_posts'), {
      content: content,
      authorName: user.displayName || user.email,
      authorId: user.uid,
      createdAt: serverTimestamp()
    });
    
    contentInput.value = '';
    await loadPosts(); // 리스트 갱신
  } catch (error) {
    alert("게시글 등록에 실패했습니다: " + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '등록하기';
  }
}

// ── 인증 상태 감지 및 이벤트 리스너 ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const formContainer = document.getElementById('post-form-container');
  const loginOverlay = document.getElementById('login-overlay');
  const authorNameDisplay = document.getElementById('post-author-name');
  
  document.getElementById('community-form').addEventListener('submit', submitPost);

  onAuthStateChanged(auth, user => {
    if (user) {
      // 로그인 시: 작성 폼 표시, 안내문구 숨김, 데이터 로드
      formContainer.style.display = 'block';
      loginOverlay.style.display = 'none';
      
      const rawName = user.displayName || user.email;
      authorNameDisplay.textContent = `작성자: ${maskName(rawName)}`;
      
      loadPosts();
    } else {
      // 비로그인 시: 작성 폼 숨김, 안내문구 표시, 데이터 비우기
      formContainer.style.display = 'none';
      loginOverlay.style.display = 'block';
      document.getElementById('community-list').innerHTML = '';
    }
  });
});
