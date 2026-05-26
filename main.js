// 1. Firebase SDK 로드 (브라우저용 CDN 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// 2. 발급받은 실제 Firebase 설정 적용
const firebaseConfig = {
  apiKey: "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain: "astro-bugil-a1dd7.firebaseapp.com",
  projectId: "astro-bugil-a1dd7",
  storageBucket: "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId: "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId: "G-21GJSVVG2G"
};

// 3. Firebase 기능 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app); // 접속자 통계 활성화
const provider = new GoogleAuthProvider();

// DOM 요소 가져오기
const loginBtn = document.getElementById('loginBtn');
const writeNoticeBtn = document.getElementById('writeNoticeBtn');
const noticeList = document.getElementById('noticeList');
const noticeModal = document.getElementById('noticeModal');
const noticeTitle = document.getElementById('noticeTitle');
const noticeContent = document.getElementById('noticeContent');
const submitNotice = document.getElementById('submitNotice');
const closeModalBtn = document.getElementById('closeModalBtn');

// 공지사항 불러오기 로직
async function loadNotices() {
  noticeList.innerHTML = ''; 
  
  const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    noticeList.innerHTML = '<div class="notice-item" style="justify-content: center; color: var(--gray);">등록된 공지사항이 없습니다.</div>';
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const noticeItem = document.createElement('div');
    noticeItem.className = 'notice-item';
    
    const dateStr = data.createdAt 
      ? new Date(data.createdAt.toDate()).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '방금 전';
    
    noticeItem.innerHTML = `
      <div style="flex: 1;">
        <div style="font-size: 0.95rem; font-weight: 500; color: var(--ink); margin-bottom: 0.25rem;">${data.title}</div>
        <div style="font-size: 0.85rem; color: var(--gray); white-space: pre-wrap;">${data.content}</div>
      </div>
      <div style="font-size: 0.8rem; color: var(--gray); flex-shrink: 0; align-self: flex-start;">${dateStr}</div>
    `;
    
    noticeList.appendChild(noticeItem);
  });
}

// 로그인/로그아웃 처리
loginBtn.addEventListener('click', () => {
  if (auth.currentUser) {
    signOut(auth);
  } else {
    signInWithPopup(auth, provider).catch(error => console.error("로그인 에러:", error));
  }
});

// 로그인 상태 감지 (버튼 및 UI 변경)
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.textContent = '관리자 로그아웃';
    writeNoticeBtn.classList.remove('hidden');
  } else {
    loginBtn.textContent = '관리자 로그인';
    writeNoticeBtn.classList.add('hidden');
  }
});

// 모달창 열기/닫기
writeNoticeBtn.addEventListener('click', () => noticeModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => noticeModal.classList.add('hidden'));

window.addEventListener('click', (e) => {
  if (e.target === noticeModal) {
    noticeModal.classList.add('hidden');
  }
});

// 공지사항 업로드 (Firestore에 데이터 쓰기)
submitNotice.addEventListener('click', async () => {
  const title = noticeTitle.value.trim();
  const content = noticeContent.value.trim();

  if (!title || !content) {
    alert('제목과 내용을 모두 입력해주세요.');
    return;
  }

  try {
    submitNotice.textContent = '업로드 중...';
    submitNotice.disabled = true;

    await addDoc(collection(db, "notices"), {
      title: title,
      content: content,
      createdAt: serverTimestamp()
    });

    alert('공지가 성공적으로 등록되었습니다!');
    
    noticeTitle.value = '';
    noticeContent.value = '';
    noticeModal.classList.add('hidden');
    submitNotice.textContent = '업로드';
    submitNotice.disabled = false;
    
    loadNotices();
  } catch (error) {
    console.error("업로드 에러:", error);
    alert('업로드 실패: 데이터베이스 쓰기 권한이 없습니다.');
    submitNotice.textContent = '업로드';
    submitNotice.disabled = false;
  }
});

// 처음 웹페이지 켰을 때 데이터 불러오기 실행
loadNotices();
