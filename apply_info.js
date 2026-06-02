import { db, auth, isOwner, isAdmin, formatDate } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, getDocs, query, orderBy, updateDoc, deleteDoc,
  doc, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const list = document.getElementById('list');
let apps = [];
let current = 'all';
let currentUserIsOwner = false;
let currentUserIsAdmin = false;

// 동적으로 불러온 질문 라벨
let q1Label = '질문 1';
let q2Label = '질문 2';

// ── 토스트 ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── 질문 라벨 불러오기 ────────────────────────────────────────────────────────
async function loadQuestionLabels() {
  try {
    const snap = await getDoc(doc(db, 'config', 'apply_questions'));
    if (snap.exists()) {
      const d = snap.data();
      if (d.q1) q1Label = d.q1;
      if (d.q2) q2Label = d.q2;
    }
  } catch {}
}

// ── Auth 확인 ─────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  const admin = await isAdmin(user);
  const owner = isOwner(user);

  if (!admin && !owner) {
    alert('관리자 또는 운영담당자만 접근 가능합니다.');
    location.href = 'index.html';
    return;
  }

  currentUserIsOwner = owner;
  currentUserIsAdmin = admin;

  await loadQuestionLabels();
  loadApps();
});

async function loadApps() {
  const snap = await getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')));
  apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}

function render() {
  const filtered = current === 'all' ? apps : apps.filter(a => a.status === current);

  list.innerHTML = '';

  document.getElementById('totalCount').textContent = apps.length;
  document.getElementById('passCount').textContent  = apps.filter(a => a.status === 'accepted').length;
  document.getElementById('failCount').textContent  = apps.filter(a => a.status === 'rejected').length;

  document.getElementById('delete-all-btn').style.display = current === 'all' ? 'inline-block' : 'none';

  if (filtered.length === 0) {
    list.innerHTML = '<div class="board-empty">조회된 신청자가 없습니다.</div>';
    return;
  }

  filtered.forEach((app, index) => {
    const div = document.createElement('div');
    div.className = 'item';

    const submitDate = app.createdAt ? formatDate(app.createdAt) : '날짜 미상';

    let statusLabel = '';
    if      (app.status === 'accepted') statusLabel = '<span class="status-badge status-accepted">합격</span>';
    else if (app.status === 'rejected') statusLabel = '<span class="status-badge status-rejected">불합격</span>';
    else                                 statusLabel = '<span class="status-badge status-pending">대기</span>';

    let actionHtml = '';
    if (currentUserIsOwner) {
      if ((app.status === 'pending' || !app.status)) {
        actionHtml += `<button class="btn pass"  data-action="pass">합격</button>
                       <button class="btn fail"  data-action="fail">불합격</button>`;
      } else {
        actionHtml += `<button class="btn reset" data-action="reset">결과 취소</button>`;
      }
    }
    actionHtml += `<button class="btn delete" data-action="delete">삭제</button>`;

    div.innerHTML = `
      <div class="left">
        <div class="name">${index + 1}. ${app.name || '(이름 없음)'} ${statusLabel}</div>
        <div class="sub">${app.email || ''} · ${app.phone || ''} · ${submitDate} 제출</div>
      </div>
      <div class="actions">${actionHtml}</div>`;

    div.onclick = () => showModal(app);
    div.querySelector('.actions').onclick = async (e) => {
      e.stopPropagation();
      const action = e.target.dataset.action;
      if (!action) return;
      if (action === 'pass')   { await updateDoc(doc(db,'applications',app.id),{status:'accepted'}); loadApps(); }
      else if (action === 'fail')  { await updateDoc(doc(db,'applications',app.id),{status:'rejected'}); loadApps(); }
      else if (action === 'reset') { await updateDoc(doc(db,'applications',app.id),{status:'pending'});  loadApps(); }
      else if (action === 'delete') {
        if (confirm('이 신청자의 데이터를 완전히 삭제할까요?')) {
          await deleteDoc(doc(db,'applications',app.id)); loadApps();
          toast('삭제되었습니다.','info');
        }
      }
    };

    list.appendChild(div);
  });
}

function showModal(app) {
  document.getElementById('modalWrap').style.display = 'flex';
  document.getElementById('modalTitle').textContent = `${app.name} 님의 지원서`;

  // 고정 질문 라벨 (1번, 2번 지원동기/탐구활동)은 기존 그대로 유지하고
  // 동적 q1, q2 라벨만 교체
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-grid">
      <div><strong>학번</strong>${app.studentId || '-'}</div>
      <div><strong>전화번호</strong>${app.phone || '-'}</div>
      <div style="grid-column:1/3"><strong>이메일</strong>${app.email || '-'}</div>
    </div>
    <div class="modal-answer">
      <strong>1. 아스트로에 지원하게 된 동기를 본인의 관심분야(수학, 물리학, 화학 등)와 관련지어 구체적으로 작성하시오.</strong>
      <pre>${app.intro || '-'}</pre>
    </div>
    <div class="modal-answer">
      <strong>2. 고등학교 진학 전 수학, 과학, 융합 분야에서 자기주도적으로 탐구한 활동을 구체적으로 서술하시오.</strong>
      <pre>${app.motivation || '-'}</pre>
    </div>
    <div class="modal-answer">
      <strong>3. ${app.q1Label || q1Label}</strong>
      <pre>${app.q1 || '-'}</pre>
    </div>
    <div class="modal-answer">
      <strong>4. ${app.q2Label || q2Label}</strong>
      <pre>${app.q2 || '-'}</pre>
    </div>
    <div class="modal-answer">
      <strong>5. 본인의 포부나 추가로 하고 싶은 말을 자유롭게 적어주세요.</strong>
      <pre>${app.extra || '-'}</pre>
    </div>`;
}

// 탭 전환
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    current = tab.dataset.status;
    const titles = { all:'전체 신청자', accepted:'합격자 목록', rejected:'불합격자 목록' };
    document.getElementById('current-tab-title').textContent = titles[current];
    render();
  };
});

// 전체 삭제
document.getElementById('delete-all-btn').onclick = async () => {
  if (apps.length === 0) return alert('삭제할 데이터가 없습니다.');
  if (!confirm('정말 모든 지원서를 삭제할까요? 복구할 수 없습니다.')) return;
  try {
    const batch = writeBatch(db);
    apps.forEach(app => batch.delete(doc(db,'applications',app.id)));
    await batch.commit();
    toast('모든 신청이 삭제되었습니다.','success');
    loadApps();
  } catch(e) { toast('삭제 오류: '+e.message,'error'); }
};

// 모달 닫기
document.getElementById('modalWrap').onclick = e => { if (e.target.id==='modalWrap') e.target.style.display='none'; };
document.getElementById('closeModalBtn').onclick  = () => { document.getElementById('modalWrap').style.display='none'; };
