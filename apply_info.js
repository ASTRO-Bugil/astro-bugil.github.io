
import {
  db
} from './firebase-config.js';

import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const list = document.getElementById('list');

let apps = [];
let current = 'all';

async function loadApps() {

  const snap = await getDocs(
    query(collection(db, 'applications'), orderBy('createdAt', 'desc'))
  );

  apps = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  render();
}

function render() {

  const filtered = current === 'all'
    ? apps
    : apps.filter(a => a.status === current);

  list.innerHTML = '';

  document.getElementById('totalCount').textContent =
    apps.length;

  document.getElementById('pendingCount').textContent =
    apps.filter(a => a.status === 'pending').length;

  document.getElementById('passCount').textContent =
    apps.filter(a => a.status === 'accepted').length;

  document.getElementById('failCount').textContent =
    apps.filter(a => a.status === 'rejected').length;

  filtered.forEach(app => {

    const div = document.createElement('div');

    div.className = 'item';

    div.innerHTML = `
      <div class="left">
        <div class="name">${app.name}</div>
        <div class="sub">
          ${app.studentId} · ${app.phone}
        </div>
      </div>

      <div class="actions">
        <button class="btn pass">합격</button>
        <button class="btn fail">불합격</button>
        <button class="btn delete">삭제</button>
      </div>
    `;

    div.querySelector('.left').onclick = () => {

      document.getElementById('modalWrap').style.display = 'flex';

      document.getElementById('modalTitle').textContent =
        `${app.name} 지원서`;

      document.getElementById('modalContent').textContent = `
학번: ${app.studentId}

이름: ${app.name}

전화번호: ${app.phone}

이메일: ${app.email}

자기소개:
${app.intro}

지원동기:
${app.motivation}

질문1:
${app.q1}

질문2:
${app.q2}

하고 싶은 말:
${app.extra}
`;
    };

    div.querySelector('.pass').onclick = async () => {
      await updateDoc(doc(db, 'applications', app.id), {
        status: 'accepted'
      });

      loadApps();
    };

    div.querySelector('.fail').onclick = async () => {
      await updateDoc(doc(db, 'applications', app.id), {
        status: 'rejected'
      });

      loadApps();
    };

    div.querySelector('.delete').onclick = async () => {

      if (!confirm('삭제할까요?')) return;

      await deleteDoc(doc(db, 'applications', app.id));

      loadApps();
    };

    list.appendChild(div);
  });
}

document.querySelectorAll('.tab').forEach(tab => {

  tab.onclick = () => {

    document.querySelectorAll('.tab')
      .forEach(t => t.classList.remove('active'));

    tab.classList.add('active');

    current = tab.dataset.status;

    render();
  };
});

document.getElementById('modalWrap').onclick = e => {
  if (e.target.id === 'modalWrap') {
    e.target.style.display = 'none';
  }
};

loadApps();

