import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let existingDocId = null;

// 질문 불러오기
async function loadQuestions() {
  try {
    const snap = await getDoc(doc(db, 'config', 'apply_questions'));
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById('q1-label').textContent = data.q1 || '질문 1';
      document.getElementById('q2-label').textContent = data.q2 || '질문 2';
    }
  } catch(e) { console.error(e); }
}

loadQuestions();

// 로그인 체크 및 기존 신청 내역 확인
onAuthStateChanged(auth, async user => {
  if (!user) {
    alert('로그인이 필요한 서비스입니다.');
    location.href = 'index.html';
    return;
  }

  // 로그인된 이메일 고정
  const emailInput = document.getElementById('email');
  emailInput.value = user.email;
  emailInput.readOnly = true;

  try {
    // 기존 가입 신청 내역 조회
    const q = query(collection(db, 'applications'), where('email', '==', user.email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // 기존 신청이 있는 경우 (수정 모드)
      const appDoc = snap.docs[0];
      existingDocId = appDoc.id;
      const d = appDoc.data();

      document.getElementById('studentId').value = d.studentId || '';
      document.getElementById('name').value = d.name || '';
      document.getElementById('phone').value = d.phone || '';
      document.getElementById('intro').value = d.intro || '';
      document.getElementById('motivation').value = d.motivation || '';
      document.getElementById('q1').value = d.q1 || '';
      document.getElementById('q2').value = d.q2 || '';
      document.getElementById('extra').value = d.extra || '';

      document.getElementById('page-title').textContent = '가입 신청 수정';
      document.getElementById('page-sub').textContent = '작성하신 신청서를 수정할 수 있습니다.';
      document.getElementById('submit-btn').textContent = '수정하기';
    }
  } catch(e) { console.error(e); }
});

// 제출 (생성 및 수정)
document.getElementById('apply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('status');
  const submitBtn = document.getElementById('submit-btn');

  submitBtn.disabled = true;
  status.className = '';
  status.textContent = '처리 중...';

  const data = {
    studentId: document.getElementById('studentId').value,
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    intro: document.getElementById('intro').value,
    motivation: document.getElementById('motivation').value,
    q1: document.getElementById('q1').value,
    q2: document.getElementById('q2').value,
    extra: document.getElementById('extra').value,
    status: 'pending', // 수정해도 상태는 다시 대기로 (또는 기존 상태 유지 원하시면 로직 변경 필요)
    updatedAt: serverTimestamp()
  };

  try {
    if (existingDocId) {
      await updateDoc(doc(db, 'applications', existingDocId), data);
      status.className = 'success';
      status.textContent = '지원서가 성공적으로 수정되었습니다!';
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'applications'), data);
      status.className = 'success';
      status.textContent = '지원서가 제출되었습니다!';
      
      // 제출 완료 후 수정 모드로 변경
      document.getElementById('page-title').textContent = '가입 신청 수정';
      document.getElementById('submit-btn').textContent = '수정하기';
      const q = query(collection(db, 'applications'), where('email', '==', data.email));
      const snap = await getDocs(q);
      if(!snap.empty) existingDocId = snap.docs[0].id;
    }
  } catch(ex) {
    status.className = 'error';
    status.textContent = '오류가 발생했습니다.';
    console.error(ex);
  } finally {
    submitBtn.disabled = false;
  }
});
