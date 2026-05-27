import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, getDocs, collection }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain:        "astro-bugil-a1dd7.firebaseapp.com",
  projectId:         "astro-bugil-a1dd7",
  storageBucket:     "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId:             "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId:     "G-21GJSVVG2G"
};

export const app       = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth      = getAuth(app);
export const db        = getFirestore(app);

// ── 권한 상수 ─────────────────────────────────────────────────────────
export const OWNER_EMAILS = [
  'yunthomas0120@gmail.com',
  'yunarchive0120@gmail.com'
];

export function isOwner(user) {
  return !!user && OWNER_EMAILS.includes(user.email);
}

// admins 컬렉션 캐시
let _adminCache = null;

export async function refreshAdminCache() {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    _adminCache = new Set(snap.docs.map(d => d.id));
  } catch {
    _adminCache = new Set();
  }
}

export async function isAdmin(user) {
  if (!user) return false;
  if (isOwner(user)) return true;
  if (!_adminCache) await refreshAdminCache();
  return _adminCache.has(user.email);
}

export function invalidateAdminCache() {
  _adminCache = null;
}

// ── 유틸 ─────────────────────────────────────────────────────────────
export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function translateAuthError(code) {
  const map = {
    'auth/user-not-found':       '등록되지 않은 이메일입니다.',
    'auth/wrong-password':       '비밀번호가 틀렸습니다.',
    'auth/invalid-email':        '이메일 형식이 잘못되었습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password':        '비밀번호는 6자 이상이어야 합니다.',
    'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
    'auth/invalid-credential':   '이메일 또는 비밀번호가 올바르지 않습니다.'
  };
  return map[code] || code;
}

export function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts.toMillis()).toLocaleDateString('ko-KR');
}
