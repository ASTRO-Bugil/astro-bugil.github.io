import { db, auth, isOwner, isAdmin, formatDate } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const list = document.getElementById('list');
let apps = [];
let current = 'all';
let currentUserIsOwner = false;

onAuthStateChanged(auth, async user => {
  const admin = await isAdmin(user);
  const owner = isOwner(user);

  if (!admin && !owner) {
    alert('관리자 또는 운영담당자만 접근 가능합니다.');
    location.href = 'index.html';
    return;
  }
  
  currentUserIsOwner = owner; // 합격/불합격 버튼 노출 여부 결정을 위해 저장
  loadApps();
});

loadQuestions();

async function loadApps() {
  const snap = await getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')));
  apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}

function render() {
  const filtered = current === 'all' ? apps : apps.filter(a => a.status === current);

  list.innerHTML = '';

  // 탭 카운트 업데이트
  document.getElementById('totalCount').textContent = apps.length;
  document.getElementById('passCount').textContent = apps.filter(a => a.status === 'accepted').length;
  document.getElementById('failCount').textContent = apps.filter(a => a.status === 'rejected').length;

  // 전체 삭제 버튼은 '전체' 탭에서만 보이게
  document.getElementById('delete-all-btn').style.display = current === 'all' ? 'block' : 'none';

  if(filtered.length === 0) {
    list.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b; border: 1px solid #e2e8f0; border-radius: 14px;">조회된 신청자가 없습니다.</div>';
    return;
  }

  filtered.forEach((app, index) => {
    const div = document.createElement('div');
    div.className = 'item';

    // 제출 일시 포맷 (예: 2026. 05. 27)
    const submitDate = app.createdAt ? formatDate(app.createdAt) : '날짜 미상';
    
    // 상태 라벨
    let statusLabel = '';
    if(app.status === 'accepted') statusLabel = '<span class="status-badge status-accepted">합격</span>';
    else if(app.status === 'rejected') statusLabel = '<span class="status-badge status-rejected">불합격</span>';
    else statusLabel = '<span class="status-badge status-pending">대기</span>';

    // 버튼 구성 (운영자 권한에 따라 분기)
    let actionHtml = '';
    if (currentUserIsOwner) {
      if (current === 'all' && (app.status === 'pending' || !app.status)) {
        actionHtml += `<button class="btn pass" data-action="pass">합격</button>
                       <button class="btn fail" data-action="fail">불합격</button>`;
      } else if (current === 'accepted' || current === 'rejected' || (current === 'all' && app.status !== 'pending')) {
        actionHtml += `<button class="btn reset" data-action="reset">결과 취소</button>`;
      }
    }
    actionHtml += `<button class="btn delete" data-action="delete">삭제</button>`;

    // 리스트 아이템 UI (순번-신청자이름 - 이메일 - 전화번호-제출일시)
    div.innerHTML = `
      <div class="left">
        <div class="name">${index + 1}. ${app.name} ${statusLabel}</div>
        <div class="sub">${app.email} · ${app.phone} · ${submitDate} 제출</div>
      </div>
      <div class="actions">
        ${actionHtml}
      </div>
    `;

    // 이벤트 위임
    div.onclick = () => showModal(app);
    
    const actionsDiv = div.querySelector('.actions');
    actionsDiv.onclick = async (e) => {
      e.stopPropagation(); // 모달 띄우기 방지
      const action = e.target.dataset.action;
      if (!action) return;

      if (action === 'pass') {
        await updateDoc(doc(db, 'applications', app.id), { status: 'accepted' });
        loadApps();
      } else if (action === 'fail') {
        await updateDoc(doc(db, 'applications', app.id), { status: 'rejected' });
        loadApps();
      } else if (action === 'reset') {
        await updateDoc(doc(db, 'applications', app.id), { status: 'pending' });
        loadApps();
      } else if (action === 'delete') {
        if (confirm('이 신청자의 데이터를 완전히 삭제할까요?')) {
          await deleteDoc(doc(db, 'applications', app.id));
          loadApps();
        }
      }
    };

    list.appendChild(div);
  });
}

function showModal(app) {
  document.getElementById('modalWrap').style.display = 'flex';
  document.getElementById('modalTitle').textContent = `${app.name} 님의 지원서`;

  document.getElementById('modalContent').innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
      <div><strong>학번:</strong> ${app.studentId}</div>
      <div><strong>전화번호:</strong> ${app.phone}</div>
      <div style="grid-column: 1 / 3;"><strong>이메일:</strong> ${app.email}</div>
    </div>
    <strong>1. 아스트로에 지원하게 된 동기를 본인의 관심분야(수학, 물리학, 화학 등)와 관련지어 구체적으로 작성하시오.</strong><pre>${app.intro}</pre>
    <strong>2. 고등학교 진학 전 수학, 과학, 융합 분야에서 자기주도적으로 탐구한 활동을 자신의 열정, 탐구력 및 창의적 문제해결력 등이 잘 드러나도록 구체적으로 서술하시오.</strong><pre>${app.motivation}</pre>
    <strong>질문2:</strong><pre>${app.q1}</pre>
    <strong>질문1:</strong><pre>${app.q2}</pre>
    <strong>5. 본인의 포부나 추가로 하고 싶은 말을 자유롭게 적어주세요.</strong><pre>${app.extra || '-'}</pre>
  `;
}

// 탭 전환
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    current = tab.dataset.status;

    const titles = { 'all': '전체 신청자', 'accepted': '합격자 목록', 'rejected': '불합격자 목록' };
    document.getElementById('current-tab-title').textContent = titles[current];
    
    render();
  };
});

// 모든 가입 신청 삭제 버튼
document.getElementById('delete-all-btn').onclick = async () => {
  if (apps.length === 0) return alert('삭제할 데이터가 없습니다.');
  if (!confirm('정말 모든 지원서를 삭제할까요? 복구할 수 없습니다.')) return;
  
  // Firestore Batch 삭제
  try {
    const batch = writeBatch(db);
    apps.forEach(app => {
      const ref = doc(db, 'applications', app.id);
      batch.delete(ref);
    });
    await batch.commit();
    alert('모든 신청이 삭제되었습니다.');
    loadApps();
  } catch(e) {
    console.error(e);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

// 모달 닫기
document.getElementById('modalWrap').onclick = e => {
  if (e.target.id === 'modalWrap') e.target.style.display = 'none';
};
document.getElementById('closeModalBtn').onclick = () => {
  document.getElementById('modalWrap').style.display = 'none';
};
