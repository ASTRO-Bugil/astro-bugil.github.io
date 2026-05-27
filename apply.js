
]import {
  db
} from './firebase-config.js';

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadQuestions() {
  try {
    const snap = await getDoc(doc(db, 'config', 'apply_questions'));

    if (snap.exists()) {
      const data = snap.data();

      document.getElementById('q1-label').textContent = data.q1 || '질문 1';
      document.getElementById('q2-label').textContent = data.q2 || '질문 2';
    }
  } catch(e) {
    console.error(e);
  }
}

loadQuestions();

document.getElementById('apply-form')
.addEventListener('submit', async (e) => {

  e.preventDefault();

  const status = document.getElementById('status');

  try {

    await addDoc(collection(db, 'applications'), {

      studentId: document.getElementById('studentId').value,
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,

      intro: document.getElementById('intro').value,
      motivation: document.getElementById('motivation').value,

      q1: document.getElementById('q1').value,
      q2: document.getElementById('q2').value,

      extra: document.getElementById('extra').value,

      status: 'pending',

      createdAt: serverTimestamp()
    });

    status.className = 'success';
    status.textContent = '지원서가 제출되었습니다!';

    e.target.reset();

  } catch(ex) {

    status.className = 'error';
    status.textContent = '오류가 발생했습니다.';

    console.error(ex);
  }

});

