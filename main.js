// Firebase SDK 불러오기 (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 사용자의 Firebase Config
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

// ★ 여기에 관리자(기장님)로 사용할 실제 구글 이메일을 정확히 입력하세요 ★
const ADMIN_EMAIL = "yunthomas0120@gmail.com"; 

// DOM 요소 가져오기
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminPanel = document.getElementById('admin-panel');
const submitNoticeBtn = document.getElementById('submit-notice-btn');
const noticeTitleInput = document.getElementById('notice-title');
const noticeList = document.getElementById('notice-list');

// 로그인 상태 감지 및 관리자 권한 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    
    // 현재 로그인한 이메일이 관리자 이메일과 일치하는지 확인
    if (user.email === ADMIN_EMAIL) {
      adminPanel.style.display = 'block'; 
    } else {
      adminPanel.style.display = 'none';
      alert('관리자 권한이 없습니다. 일반 방문자 환영합니다!');
    }
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    adminPanel.style.display = 'none'; 
  }
});

// 로그인
loginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .catch((error) => console.error("로그인 에러:", error));
});

// 로그아웃
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    alert("로그아웃 되었습니다.");
  }).catch((error) => console.error("로그아웃 에러:", error));
});

// 공지사항 불러오기
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

// 공지사항 작성하기
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

// 최초 로드 시 실행
window.addEventListener('DOMContentLoaded', loadNotices);

