// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ★ 여기에 관리자 이메일을 정확히 입력하세요 ★
const ADMIN_EMAIL = "여기에_관리자_이메일_입력@gmail.com"; 

// DOM 요소 (네비게이션)
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name-display');

// DOM 요소 (글쓰기)
const adminPanel = document.getElementById('admin-panel');
const submitNoticeBtn = document.getElementById('submit-notice-btn');
const noticeTitleInput = document.getElementById('notice-title');
const noticeList = document.getElementById('notice-list');

// DOM 요소 (모달 팝업)
const loginModal = document.getElementById('login-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const emailLoginBtn = document.getElementById('email-login-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// 1. 로그인 상태 감지 및 UI 업데이트
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    
    const displayName = user.displayName || user.email.split('@')[0];
    
    // 관리자 여부 확인
    if (user.email === ADMIN_EMAIL) {
      adminPanel.style.display = 'block'; 
      userNameDisplay.textContent = `⭐ ${displayName} (관리자)`;
    } else {
      adminPanel.style.display = 'none';
      userNameDisplay.textContent = `${displayName}님 환영합니다`;
    }
    
    userNameDisplay.style.display = 'inline-block';
    loginModal.style.display = 'none'; // 로그인 성공 시 모달 닫기
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    adminPanel.style.display = 'none'; 
    userNameDisplay.style.display = 'none';
    userNameDisplay.textContent = '';
  }
});

// 2. 모달 열기 / 닫기
loginBtn.addEventListener('click', () => {
  loginModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === loginModal) {
    loginModal.style.display = 'none';
  }
});

// 3. 로그인 / 로그아웃 기능
googleLoginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .catch((error) => {
      console.error("구글 로그인 에러:", error);
      alert("로그인 중 오류가 발생했습니다.");
    });
});

emailLoginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 모두 입력해주세요.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      emailInput.value = '';
      passwordInput.value = '';
    })
    .catch((error) => {
      console.error("이메일 로그인 에러:", error);
      alert("이메일이나 비밀번호가 올바르지 않습니다.");
    });
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    alert("로그아웃 되었습니다.");
  }).catch((error) => console.error("로그아웃 에러:", error));
});

// 4. 공지사항 데이터 불러오기
async function loadNotices() {
  noticeList.innerHTML = ''; 
  
  try {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      noticeList.innerHTML = '<div class="notice-item"><div class="notice-title">등록된 공지사항이 없습니다.</div></div>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전';
      
      const noticeHTML = `
        <a href="#" class="notice-item">
          <span class="notice-badge new">공지</span>
          <div class="notice-title">${data.title}</div>
          <div class="notice-date">${date}</div>
        </a>
      `;
      noticeList.insertAdjacentHTML('beforeend', noticeHTML);
    });
  } catch (error) {
    console.error("공지사항 불러오기 에러:", error);
    noticeList.innerHTML = '<div class="notice-item"><div class="notice-title">공지사항을 불러오는 중 오류가 발생했습니다.</div></div>';
  }
}

// 5. 공지사항 데이터 쓰기
submitNoticeBtn.addEventListener('click', async () => {
  const title = noticeTitleInput.value.trim();
  if (title === "") {
    alert("공지사항 제목을 입력해주세요!");
    return;
  }

  try {
    await addDoc(collection(db, "notices"), {
      title: title,
      createdAt: serverTimestamp()
    });
    
    alert("공지사항이 성공적으로 등록되었습니다!");
    noticeTitleInput.value = ""; 
    loadNotices(); 
    
  } catch (error) {
    console.error("공지사항 등록 에러:", error);
    alert("등록 권한이 없거나 오류가 발생했습니다.");
  }
});

// 6. 페이지 로드 완료 시 공지사항 목록 표시
window.addEventListener('DOMContentLoaded', loadNotices);
