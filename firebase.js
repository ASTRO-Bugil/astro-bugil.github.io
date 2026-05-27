<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ASTRO - Bugil Academy</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --blue:#3b82f6; --blue-light:#eff6ff; --blue-mid:#dbeafe;
    --ink:#1e293b; --gray:#64748b; --gray-light:#f1f5f9;
    --border:#e2e8f0; --white:#ffffff; --red:#dc2626;
    --red-light:#fef2f2; --orange:#f59e0b; --orange-light:#fffbeb;
    --green:#10b981; --green-light:#ecfdf5;
    --purple:#8b5cf6; --purple-light:#f5f3ff;
  }
  body { font-family:'Noto Sans KR',sans-serif; background:var(--white); color:var(--ink); font-size:15px; line-height:1.7; }

  /* SITE BANNER */
  #site-banner {
    display:none; width:100%; padding:0.75rem 6%;
    font-size:0.85rem; font-weight:500;
    align-items:center; justify-content:space-between; gap:1rem; z-index:50;
  }
  #site-banner.banner-info    { background:var(--blue-light);   color:var(--blue);   border-bottom:1px solid var(--blue-mid); }
  #site-banner.banner-warning { background:var(--orange-light);  color:#b45309;       border-bottom:1px solid #fde68a; }
  #site-banner.banner-danger  { background:var(--red-light);    color:var(--red);    border-bottom:1px solid #fecaca; }
  .banner-left { display:flex; align-items:center; gap:0.6rem; flex:1; }
  .banner-actions { display:flex; align-items:center; gap:0.75rem; flex-shrink:0; }
  .banner-dismiss { font-size:0.75rem; color:inherit; opacity:0.7; background:none; border:none; cursor:pointer; font-family:inherit; font-weight:500; padding:4px 8px; border-radius:4px; transition:opacity 0.15s,background 0.15s; }
  .banner-dismiss:hover { opacity:1; background:rgba(0,0,0,0.06); }
  .banner-close { background:none; border:none; cursor:pointer; color:inherit; opacity:0.5; font-size:1.1rem; line-height:1; }
  .banner-close:hover { opacity:1; }

  /* NAV */
  nav { display:flex; align-items:center; justify-content:space-between; padding:0 6%; height:60px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--white); z-index:10; }
  .logo { font-weight:700; font-size:1rem; color:var(--ink); text-decoration:none; display:flex; align-items:center; gap:8px; }
  .nav-logo-icon { width:40px; height:40px; object-fit:contain; }
  .nav-links { display:flex; gap:2rem; list-style:none; }
  .nav-links a { font-size:0.875rem; color:var(--gray); text-decoration:none; transition:color 0.2s; }
  .nav-links a:hover { color:var(--ink); }
  .nav-right { display:flex; align-items:center; gap:0.75rem; }
  #user-info { font-size:0.8rem; color:var(--gray); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:none; }

  /* HERO */
  .hero { padding:80px 6% 60px; display:flex; align-items:center; justify-content:space-between; gap:3rem; }
  .hero-text { flex:1; max-width:520px; }
  .hero-logo { flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .hero-logo img { width:580px; height:580px; object-fit:contain; transform:translateX(-40px); }
  .hero-tag { display:inline-block; background:var(--blue-light); color:var(--blue); font-size:0.78rem; font-weight:500; padding:4px 12px; border-radius:20px; margin-bottom:1.5rem; }
  .hero h1 { font-size:2.4rem; font-weight:700; line-height:1.25; letter-spacing:-0.03em; color:var(--ink); margin-bottom:1rem; }
  .hero p { font-size:1rem; color:var(--gray); max-width:480px; margin-bottom:2rem; font-weight:300; }
  .hero-btns { display:flex; gap:0.75rem; flex-wrap:wrap; }

  /* BUTTONS */
  .btn { display:inline-block; padding:0.6rem 1.4rem; border-radius:8px; font-size:0.875rem; font-weight:500; text-decoration:none; cursor:pointer; transition:all 0.2s; border:none; font-family:inherit; }
  .btn-blue { background:var(--blue); color:var(--white); }
  .btn-blue:hover { background:#2563eb; }
  .btn-blue:disabled { opacity:0.6; cursor:not-allowed; }
  .btn-outline { background:transparent; color:var(--gray); border:1px solid var(--border); }
  .btn-outline:hover { background:var(--gray-light); color:var(--ink); }
  .btn-sm { padding:0.45rem 1rem; font-size:0.8rem; }
  .btn-xs { padding:0.3rem 0.7rem; font-size:0.75rem; }

  /* DIVIDER */
  .divider { border:none; border-top:1px solid var(--border); margin:0 6%; }

  /* SECTION */
  section { padding:60px 6%; }
  .section-label { font-size:0.75rem; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; color:var(--blue); margin-bottom:1rem; }
  h2 { font-size:1.5rem; font-weight:700; letter-spacing:-0.02em; color:var(--ink); margin-bottom:0.5rem; }
  .sub { font-size:0.9rem; color:var(--gray); margin-bottom:2.5rem; font-weight:300; }

  /* CARDS */
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1rem; }
  .card { border:1px solid var(--border); border-radius:12px; padding:1.5rem; background:var(--white); transition:box-shadow 0.2s,border-color 0.2s; }
  .card:hover { border-color:var(--blue); box-shadow:0 2px 12px rgba(59,130,246,0.1); }
  .card-icon { font-size:1.6rem; margin-bottom:0.75rem; display:block; }
  .card h3 { font-size:0.95rem; font-weight:600; margin-bottom:0.4rem; color:var(--ink); }
  .card p { font-size:0.825rem; color:var(--gray); line-height:1.6; font-weight:300; }

  /* NOTICE */
  .notice-list { display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; overflow:hidden; min-height:60px; }
  .notice-item { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border); color:var(--ink); transition:background 0.15s; }
  .notice-item:last-child { border-bottom:none; }
  .notice-item:hover { background:var(--gray-light); }
  .notice-badge { font-size:0.7rem; font-weight:500; padding:2px 8px; border-radius:4px; flex-shrink:0; background:var(--blue-mid); color:var(--blue); }
  .notice-badge.new { background:#fef3c7; color:#d97706; }
  .notice-title { flex:1; font-size:0.9rem; }
  .notice-date { font-size:0.78rem; color:var(--gray); flex-shrink:0; }
  .notice-del-btn { background:none; border:none; cursor:pointer; color:var(--gray); font-size:0.85rem; padding:2px 6px; border-radius:4px; transition:background 0.15s,color 0.15s; flex-shrink:0; }
  .notice-del-btn:hover { background:#fee2e2; color:var(--red); }

  /* ADMIN PANEL */
  #admin-panel { display:none; margin-top:1.25rem; background:var(--blue-light); border:1px dashed var(--blue); border-radius:10px; padding:1rem 1.25rem; }
  #admin-panel > p { font-size:0.8rem; color:var(--blue); margin-bottom:0.75rem; font-weight:500; }
  #notice-add-form { display:flex; gap:0.5rem; }
  #notice-input { flex:1; padding:0.5rem 0.75rem; border:1px solid var(--border); border-radius:8px; font-size:0.875rem; font-family:inherit; outline:none; }
  #notice-input:focus { border-color:var(--blue); }

  /* FOOTER */
  footer { padding:2rem 6%; border-top:1px solid var(--border); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem; }
  footer p { font-size:0.8rem; color:var(--gray); }
  .footer-links { display:flex; gap:1.5rem; }
  .footer-links a { font-size:0.8rem; color:var(--gray); text-decoration:none; }
  .footer-links a:hover { color:var(--ink); }

  /* MODAL */
  .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:100; align-items:center; justify-content:center; padding:1rem; }
  .modal { background:var(--white); border-radius:16px; padding:2rem; width:100%; max-width:420px; position:relative; animation:modal-in 0.2s ease; max-height:90vh; overflow-y:auto; }
  @keyframes modal-in { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .modal-close { position:absolute; top:1rem; right:1rem; background:none; border:none; cursor:pointer; font-size:1.2rem; color:var(--gray); line-height:1; }
  .modal-close:hover { color:var(--ink); }
  .modal h3 { font-size:1.15rem; font-weight:700; margin-bottom:1.5rem; color:var(--ink); }
  .form-group { margin-bottom:1rem; }
  .form-group label { display:block; font-size:0.8rem; font-weight:500; color:var(--gray); margin-bottom:0.35rem; }
  .form-group input,.form-group textarea,.form-group select { width:100%; padding:0.6rem 0.85rem; border:1px solid var(--border); border-radius:8px; font-size:0.875rem; font-family:inherit; color:var(--ink); outline:none; transition:border-color 0.2s; background:var(--white); resize:vertical; }
  .form-group input:focus,.form-group textarea:focus { border-color:var(--blue); }
  .form-error { font-size:0.78rem; color:var(--red); margin-top:0.5rem; min-height:1.2em; }
  .divider-text { display:flex; align-items:center; gap:0.75rem; font-size:0.75rem; color:var(--gray); margin:1rem 0; }
  .divider-text::before,.divider-text::after { content:''; flex:1; height:1px; background:var(--border); }
  .btn-google { width:100%; background:var(--white); color:var(--ink); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.6rem; border-radius:8px; font-size:0.875rem; font-weight:500; cursor:pointer; font-family:inherit; transition:background 0.15s; }
  .btn-google:hover { background:var(--gray-light); }
  .btn-google img { width:18px; height:18px; }
  .modal-link { font-size:0.78rem; text-align:center; margin-top:1rem; color:var(--gray); }
  .modal-link a { color:var(--blue); text-decoration:none; }

  /* CONSOLE MODAL */
  #console-modal .modal { max-width:700px; padding:0; overflow:hidden; }
  .console-header { padding:1.5rem 2rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .console-header h3 { font-size:1.1rem; font-weight:700; color:var(--ink); margin:0; }
  .console-badge { font-size:0.7rem; font-weight:600; padding:3px 10px; border-radius:20px; background:linear-gradient(135deg,#8b5cf6,#3b82f6); color:white; letter-spacing:0.05em; }
  .console-tabs { display:flex; border-bottom:1px solid var(--border); background:var(--gray-light); overflow-x:auto; }
  .console-tab { padding:0.75rem 1.25rem; font-size:0.82rem; font-weight:500; color:var(--gray); cursor:pointer; border:none; background:none; font-family:inherit; white-space:nowrap; border-bottom:2px solid transparent; transition:color 0.15s,border-color 0.15s; }
  .console-tab:hover { color:var(--ink); }
  .console-tab.active { color:var(--blue); border-bottom-color:var(--blue); background:var(--white); }
  .console-body { padding:1.5rem 2rem; min-height:360px; max-height:60vh; overflow-y:auto; }
  .console-panel { display:none; }
  .console-panel.active { display:block; }
  .console-section-title { font-size:0.78rem; font-weight:600; color:var(--gray); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:0.9rem; }

  /* STATS */
  .stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:0.75rem; margin-bottom:1.25rem; }
  .stat-card { padding:1rem; border:1px solid var(--border); border-radius:10px; }
  .stat-value { font-size:1.8rem; font-weight:700; color:var(--ink); line-height:1; }
  .stat-label { font-size:0.78rem; color:var(--gray); margin-top:0.25rem; }

  /* ADMIN LIST */
  .admin-list { display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.25rem; }
  .admin-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border:1px solid var(--border); border-radius:8px; }
  .admin-avatar { width:34px; height:34px; border-radius:50%; background:var(--blue-mid); color:var(--blue); display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:600; flex-shrink:0; }
  .admin-avatar.owner { background:linear-gradient(135deg,#8b5cf6,#3b82f6); color:white; }
  .admin-info { flex:1; min-width:0; }
  .admin-email { font-size:0.85rem; font-weight:500; color:var(--ink); }
  .admin-role-sub { font-size:0.75rem; color:var(--gray); }
  .role-badge { font-size:0.68rem; font-weight:600; padding:2px 8px; border-radius:20px; flex-shrink:0; }
  .role-badge.owner { background:var(--purple-light); color:var(--purple); }
  .role-badge.admin { background:var(--blue-mid); color:var(--blue); }

  /* BANNER FORM */
  .banner-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; }
  .banner-type-btn { padding:0.5rem; border:1.5px solid var(--border); border-radius:8px; background:none; cursor:pointer; font-family:inherit; font-size:0.8rem; font-weight:500; transition:all 0.15s; text-align:center; }
  .banner-type-btn.selected { border-color:var(--blue); background:var(--blue-light); color:var(--blue); }
  .banner-preview { padding:0.75rem 1rem; border-radius:8px; font-size:0.82rem; display:none; align-items:center; gap:0.5rem; }
  .banner-preview.visible { display:flex; }

  /* QUESTION SETTINGS */
  .q-input { width:100%; padding:0.55rem 0.85rem; border:1px solid var(--border); border-radius:8px; font-size:0.875rem; font-family:inherit; outline:none; margin-bottom:0.5rem; }
  .q-input:focus { border-color:var(--blue); }

  /* DROPDOWN */
  .nav-menu-wrap { position:relative; }
  .nav-dropdown { position:absolute; top:calc(100% + 8px); right:0; background:var(--white); border:1px solid var(--border); border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.1); min-width:160px; overflow:hidden; display:none; z-index:200; animation:modal-in 0.15s ease; }
  .nav-dropdown.open { display:block; }
  .nav-dropdown button { width:100%; text-align:left; padding:0.6rem 1rem; background:none; border:none; cursor:pointer; font-size:0.85rem; font-family:inherit; color:var(--ink); transition:background 0.15s; }
  .nav-dropdown button:hover { background:var(--gray-light); }
  .nav-dropdown button.danger { color:var(--red); }
  .dropdown-divider { height:1px; background:var(--border); }

  /* TOAST */
  #toast-container { position:fixed; bottom:1.5rem; right:1.5rem; display:flex; flex-direction:column; gap:0.5rem; z-index:9999; }
  .toast { padding:0.75rem 1.25rem; border-radius:10px; font-size:0.85rem; font-weight:500; box-shadow:0 4px 20px rgba(0,0,0,0.15); animation:modal-in 0.25s ease; max-width:300px; }
  .toast-success { background:var(--green); color:white; }
  .toast-error   { background:var(--red);   color:white; }
  .toast-info    { background:var(--blue);  color:white; }

  /* INPUT ROW */
  .input-row { display:flex; gap:0.5rem; }
  .input-row input { flex:1; padding:0.55rem 0.85rem; border:1px solid var(--border); border-radius:8px; font-size:0.875rem; font-family:inherit; outline:none; }
  .input-row input:focus { border-color:var(--blue); }

  @media(max-width:700px){
    .hero{flex-direction:column-reverse;align-items:flex-start;padding-top:48px}
    .hero-logo img{width:200px;height:200px;transform:translateX(0)}
    .nav-links{display:none}
    #console-modal .modal{max-width:100%;border-radius:12px}
    .stats-grid{grid-template-columns:1fr}
  }
  @media(max-width:600px){ .hero h1{font-size:1.8rem} }
</style>
</head>
<body>

<div id="site-banner">
  <div class="banner-left">
    <span id="banner-icon">📢</span>
    <span id="banner-text"></span>
  </div>
  <div class="banner-actions">
    <button class="banner-dismiss" id="banner-dismiss-today">오늘 하루 보지 않기</button>
    <button class="banner-close" id="banner-close">✕</button>
  </div>
</div>

<nav>
  <a href="index.html" class="logo">
    <img src="logo.png" alt="ASTRO 로고" class="nav-logo-icon">
    ASTRO v24
  </a>
  <ul class="nav-links">
    <li><a href="#activities">활동보기</a></li>
    <li><a href="#notice">공지사항</a></li>
    <li><a href="apply.html">가입 신청</a></li>
  </ul>
  <div class="nav-right">
    <span id="user-info"></span>
    <button id="login-btn" class="btn btn-outline btn-sm">로그인</button>
    <div class="nav-menu-wrap" id="user-menu-wrap" style="display:none">
      <button id="user-menu-btn" class="btn btn-outline btn-sm">메뉴 ▾</button>
      <div class="nav-dropdown" id="user-dropdown">
        <button id="open-console-btn" style="display:none">🖥️ 운영자 콘솔</button>
        <div class="dropdown-divider" id="console-divider" style="display:none"></div>
        <button id="logout-btn" class="danger">로그아웃</button>
      </div>
    </div>
  </div>
</nav>

<div class="hero">
  <div class="hero-text">
    <span class="hero-tag">북일고등학교 항공우주·기계공학 동아리</span>
    <h1>Bugil Academy<br>ASTRO 🚀</h1>
    <p>20년 역사의 북일고등학교 최고의 공학 동아리입니다. 공학도를 꿈꾸는 열정적인 학생들이 모여 미래를 준비하는 배움의 공동체입니다.</p>
    <div class="hero-btns">
      <a href="#activities" class="btn btn-blue">활동 보기</a>
      <a href="apply.html" class="btn btn-outline">가입 신청 →</a>
    </div>
  </div>
  <div class="hero-logo">
    <img src="logo.png" alt="ASTRO 동아리 로고">
  </div>
</div>

<hr class="divider">

<section id="activities">
  <p class="section-label">Activities</p>
  <h2>이런 걸 해요</h2>
  <p class="sub">학술 교류 행사, 공학 실험 활동, 전산유체역학 CFD 프로그램 학습 등 다양한 활동을 진행합니다.</p>
  <div class="cards">
    <div class="card"><span class="card-icon">💻</span><h3>항공기 플랩 모형 제작</h3><p>항공기의 플랩 모형 제작 활동을 통해 유체역학과 항공우주공학을 심화 탐구합니다.</p></div>
    <div class="card"><span class="card-icon">🏆</span><h3>대회 참가</h3><p>국립중앙과학관에서 개최하는 전국 과학 전람회에 참가합니다.</p></div>
    <div class="card"><span class="card-icon">🛠️</span><h3>CNC 로켓 실험</h3><p>CNC 공법으로 제작한 로켓 본체와 고체연료를 통해 로켓을 발사하는 실험을 진행합니다.</p></div>
    <div class="card"><span class="card-icon">🎤</span><h3>학술 교류</h3><p>한민고등학교, 용인외국어대학교부설고등학교, 경기북과학고등학교와 학술 교류를 진행합니다.</p></div>
  </div>
</section>

<hr class="divider">

<section id="notice">
  <p class="section-label">Notice</p>
  <h2>공지사항</h2>
  <p class="sub">최근 소식을 확인하세요.</p>
  <div id="notice-list" class="notice-list"></div>
  <div id="admin-panel">
    <p>🔒 관리자 모드 — 공지사항 등록</p>
    <form id="notice-add-form">
      <input type="text" id="notice-input" placeholder="공지사항 제목을 입력하세요" required maxlength="100">
      <button type="submit" class="btn btn-blue btn-sm">등록</button>
    </form>
  </div>
</section>

<hr class="divider">

<section id="join" style="background:var(--gray-light);border-radius:16px;margin:0 0 2rem;max-width:calc(100% - 12%);">
  <p class="section-label">Join Us</p>
  <h2>같이 해요! 👋</h2>
  <p class="sub" style="margin-bottom:1.5rem;">공학도를 지망하는 모두를 환영합니다. 아래 버튼으로 신청해주세요.</p>
  <a href="apply.html" class="btn btn-blue" style="font-size:0.9rem;padding:0.7rem 1.75rem;">가입 신청 페이지로 이동 →</a>
  <p style="margin-top:1.25rem;font-size:0.8rem;color:var(--gray);">문의: 담당 선생님께 직접 문의하세요.</p>
</section>

<footer>
  <p>© 2026 ASTRO - Bugil Academy · 지도교사: 차미숙 선생님, 이현 선생님</p>
  <div class="footer-links"><a href="#">인스타그램</a><a href="#">깃허브</a></div>
</footer>

<div id="toast-container"></div>

<!-- LOGIN MODAL -->
<div id="login-modal" class="modal-overlay">
  <div class="modal">
    <button class="modal-close">✕</button>
    <div id="login-tab">
      <h3>🔐 로그인</h3>
      <button id="google-login-btn" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
        Google로 로그인
      </button>
      <div class="divider-text">또는 이메일로 로그인</div>
      <form id="email-login-form">
        <div class="form-group"><label>이메일</label><input type="email" id="login-email" placeholder="example@email.com" required></div>
        <div class="form-group"><label>비밀번호</label><input type="password" id="login-pw" placeholder="비밀번호" required></div>
        <p id="login-error" class="form-error"></p>
        <button type="submit" class="btn btn-blue" style="width:100%">로그인</button>
      </form>
      <p class="modal-link">계정이 없으신가요? <a href="#" id="go-signup">회원가입</a></p>
    </div>
    <div id="signup-tab" style="display:none">
      <h3>✏️ 회원가입</h3>
      <form id="email-signup-form">
        <div class="form-group"><label>이메일</label><input type="email" id="signup-email" placeholder="example@email.com" required></div>
        <div class="form-group"><label>비밀번호 (6자 이상)</label><input type="password" id="signup-pw" placeholder="비밀번호" required minlength="6"></div>
        <p id="signup-error" class="form-error"></p>
        <button type="submit" class="btn btn-blue" style="width:100%">가입하기</button>
      </form>
      <p class="modal-link">이미 계정이 있으신가요? <a href="#" id="go-login">로그인</a></p>
    </div>
  </div>
</div>

<!-- OWNER CONSOLE MODAL -->
<div id="console-modal" class="modal-overlay">
  <div class="modal" style="max-width:700px;padding:0;overflow:hidden;">
    <div class="console-header">
      <h3>🖥️ 운영자 콘솔</h3>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span class="console-badge">OWNER</span>
        <button class="modal-close" style="position:static;">✕</button>
      </div>
    </div>
    <div class="console-tabs">
      <button class="console-tab active" data-tab="overview">📊 개요</button>
      <button class="console-tab" data-tab="admins">👥 관리자</button>
      <button class="console-tab" data-tab="banner">📢 배너</button>
      <button class="console-tab" data-tab="questions">❓ 지원 질문</button>
      <button class="console-tab" data-tab="applications">📋 가입 신청</button>
      <button class="console-tab" data-tab="notices">📝 공지</button>
    </div>
    <div class="console-body">

      <!-- 개요 -->
      <div class="console-panel active" id="panel-overview">
        <p class="console-section-title">사이트 현황</p>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value" id="stat-notices">—</div><div class="stat-label">등록된 공지사항</div></div>
          <div class="stat-card"><div class="stat-value" id="stat-applicants">—</div><div class="stat-label">전체 가입 신청</div></div>
          <div class="stat-card"><div class="stat-value" id="stat-pending">—</div><div class="stat-label">검토 대기</div></div>
          <div class="stat-card"><div class="stat-value" id="stat-admins">—</div><div class="stat-label">임명된 관리자</div></div>
        </div>
        <p class="console-section-title" style="margin-top:1.25rem;">빠른 작업</p>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="switchTab('banner')">📢 배너 수정</button>
          <button class="btn btn-outline btn-sm" onclick="switchTab('admins')">👥 관리자 추가</button>
          <button class="btn btn-outline btn-sm" onclick="switchTab('questions')">❓ 질문 설정</button>
          <a href="apply_info.html" target="_blank" class="btn btn-outline btn-sm">📋 신청자 관리 페이지</a>
        </div>
      </div>

      <!-- 관리자 -->
      <div class="console-panel" id="panel-admins">
        <p class="console-section-title">현재 관리자 목록</p>
        <div class="admin-list" id="console-admin-list"><div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div></div>
        <p class="console-section-title">새 관리자 추가</p>
        <p style="font-size:0.8rem;color:var(--gray);margin-bottom:0.75rem;">추가된 관리자는 공지사항 등록·삭제 권한을 갖습니다. 관리자 임명은 운영담당자 전용입니다.</p>
        <div class="input-row">
          <input type="email" id="new-admin-email" placeholder="추가할 관리자 이메일">
          <button class="btn btn-blue btn-sm" id="add-admin-btn">추가</button>
        </div>
        <p id="admin-add-error" class="form-error"></p>
      </div>

      <!-- 배너 -->
      <div class="console-panel" id="panel-banner">
        <p class="console-section-title">현재 배너 상태</p>
        <div id="current-banner-info" style="margin-bottom:1.25rem;padding:0.75rem 1rem;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;color:var(--gray);">불러오는 중...</div>
        <p class="console-section-title">배너 설정</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <div>
            <label style="font-size:0.8rem;font-weight:500;color:var(--gray);display:block;margin-bottom:0.5rem;">배너 유형</label>
            <div class="banner-type-grid">
              <button class="banner-type-btn selected" data-type="info">ℹ️ 안내</button>
              <button class="banner-type-btn" data-type="warning">⚠️ 경고</button>
              <button class="banner-type-btn" data-type="danger">🚨 긴급</button>
            </div>
          </div>
          <div>
            <label style="font-size:0.8rem;font-weight:500;color:var(--gray);display:block;margin-bottom:0.35rem;">배너 메시지</label>
            <input type="text" id="banner-msg-input" placeholder="예) 🔧 오늘 오후 2시~4시 서버 점검 예정" style="width:100%;padding:0.6rem 0.85rem;border:1px solid var(--border);border-radius:8px;font-size:0.875rem;font-family:inherit;outline:none;" maxlength="200">
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <input type="checkbox" id="banner-dismissible" checked style="width:auto;">
            <label for="banner-dismissible" style="font-size:0.85rem;color:var(--ink);margin:0;">"오늘 하루 보지 않기" 버튼 표시</label>
          </div>
          <div id="banner-preview-box" class="banner-preview">
            <span id="preview-icon">📢</span>
            <span id="preview-text" style="font-size:0.82rem;font-weight:500;"></span>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-blue btn-sm" id="save-banner-btn">배너 게시</button>
            <button class="btn btn-outline btn-sm" id="remove-banner-btn">배너 제거</button>
          </div>
        </div>
      </div>

      <!-- 지원 질문 설정 -->
      <div class="console-panel" id="panel-questions">
        <p class="console-section-title">가입 신청 질문 설정</p>
        <p style="font-size:0.82rem;color:var(--gray);margin-bottom:1rem;">apply.html 가입 신청 폼에 표시되는 질문 1, 질문 2를 설정합니다.</p>
        <div style="margin-bottom:1rem;">
          <label style="font-size:0.82rem;font-weight:500;color:var(--gray);display:block;margin-bottom:0.4rem;">질문 1</label>
          <input type="text" id="q1-input" class="q-input" placeholder="예) 본인의 관심 분야를 적어주세요." maxlength="200">
        </div>
        <div style="margin-bottom:1.25rem;">
          <label style="font-size:0.82rem;font-weight:500;color:var(--gray);display:block;margin-bottom:0.4rem;">질문 2</label>
          <input type="text" id="q2-input" class="q-input" placeholder="예) ASTRO에서 이루고 싶은 목표는 무엇인가요?" maxlength="200">
        </div>
        <button class="btn btn-blue btn-sm" id="save-questions-btn">질문 저장</button>
        <p id="questions-status" style="font-size:0.78rem;color:var(--green);margin-top:0.5rem;min-height:1.2em;"></p>
      </div>

      <!-- 가입 신청 (페이지 이동) -->
      <div class="console-panel" id="panel-applications">
        <p class="console-section-title">가입 신청 관리</p>
        <p style="font-size:0.85rem;color:var(--gray);margin-bottom:1.5rem;">신청자 목록 확인, 합격/불합격 처리, 신청서 삭제 등의 기능은 전용 관리 페이지에서 제공됩니다.</p>
        <a href="apply_info.html" target="_blank" class="btn btn-blue" style="font-size:0.9rem;padding:0.7rem 1.75rem;">📋 신청자 관리 페이지 열기 →</a>
      </div>

      <!-- 공지 관리 -->
      <div class="console-panel" id="panel-notices">
        <p class="console-section-title">공지사항 관리</p>
        <div class="input-row" style="margin-bottom:1rem;">
          <input type="text" id="console-notice-input" placeholder="공지사항 제목">
          <button class="btn btn-blue btn-sm" id="console-add-notice-btn">등록</button>
        </div>
        <div id="console-notice-list" style="display:flex;flex-direction:column;gap:0.4rem;"></div>
      </div>

    </div>
  </div>
</div>

<script type="module" src="main.js"></script>
</body>
</html> 
가 index.html 이고

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, setDoc, getDoc, updateDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// ── Firebase 초기화 ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCtV0rzA4ZbBt9xv8Yogw6Y9dgA2-hydU0",
  authDomain:        "astro-bugil-a1dd7.firebaseapp.com",
  projectId:         "astro-bugil-a1dd7",
  storageBucket:     "astro-bugil-a1dd7.firebasestorage.app",
  messagingSenderId: "751134919017",
  appId:             "1:751134919017:web:814be1b6b5cefb09c595f8",
  measurementId:     "G-21GJSVVG2G"
};

const app  = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db   = getFirestore(app);
const gp   = new GoogleAuthProvider();

// ── 권한 ──────────────────────────────────────────────────────────────────────
const OWNER_EMAILS = ['yunthomas0120@gmail.com', 'yunarchive0120@gmail.com'];

function isOwner(user) { return !!user && OWNER_EMAILS.includes(user.email); }

let _adminSet = null;
async function fetchAdmins() {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    _adminSet = new Set(snap.docs.map(d => d.id));
  } catch { _adminSet = new Set(); }
}
async function checkAdmin(user) {
  if (!user) return false;
  if (isOwner(user)) return true;
  if (!_adminSet) await fetchAdmins();
  return _adminSet.has(user.email);
}

// ── 토스트 ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(ts) {
  return ts ? new Date(ts.toMillis()).toLocaleDateString('ko-KR') : '';
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display='none'); document.body.style.overflow=''; }
function translateAuthError(code) {
  const m = { 'auth/user-not-found':'등록되지 않은 이메일입니다.','auth/wrong-password':'비밀번호가 틀렸습니다.','auth/invalid-email':'이메일 형식이 잘못되었습니다.','auth/email-already-in-use':'이미 사용 중인 이메일입니다.','auth/weak-password':'비밀번호는 6자 이상이어야 합니다.','auth/popup-closed-by-user':'로그인 창이 닫혔습니다.','auth/invalid-credential':'이메일 또는 비밀번호가 올바르지 않습니다.' };
  return m[code] || code;
}

// ── 공지사항 ──────────────────────────────────────────────────────────────────
async function loadNotices() {
  const list = document.getElementById('notice-list');
  list.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">불러오는 중...</p>';
  try {
    const snap = await getDocs(query(collection(db,'notices'), orderBy('createdAt','desc')));
    list.innerHTML = '';
    if (snap.empty) { list.innerHTML = '<p style="padding:1rem 1.25rem;color:var(--gray);font-size:0.85rem;">등록된 공지사항이 없습니다.</p>'; return; }
    snap.forEach(d => {
      const data = d.data();
      const isNew = data.createdAt && (Date.now()-data.createdAt.toMillis() < 7*24*60*60*1000);
      const item = document.createElement('div');
      item.className = 'notice-item';
      item.innerHTML = `
        <span class="notice-badge${isNew?' new':''}">${isNew?'NEW':'공지'}</span>
        <span class="notice-title">${esc(data.title)}</span>
        <span class="notice-date">${fmtDate(data.createdAt)}</span>
        <button class="notice-del-btn" data-id="${d.id}" style="display:none">✕</button>`;
      list.appendChild(item);
    });
  } catch(e) { list.innerHTML = `<p style="padding:1rem 1.25rem;color:#dc2626;font-size:0.85rem;">오류: ${e.message}</p>`; }
  updateDelBtns();
}

async function updateDelBtns() {
  const ok = await checkAdmin(auth.currentUser);
  document.querySelectorAll('.notice-del-btn').forEach(b => b.style.display = ok ? 'inline-block' : 'none');
}

async function addNotice(title) {
  if (!title.trim()) return;
  if (!(await checkAdmin(auth.currentUser))) { toast('관리자만 등록할 수 있습니다.','error'); return; }
  await addDoc(collection(db,'notices'), { title:title.trim(), createdAt:serverTimestamp() });
  loadNotices();
  toast('공지사항이 등록되었습니다.','success');
}

async function deleteNotice(id) {
  if (!(await checkAdmin(auth.currentUser))) { toast('관리자만 삭제할 수 있습니다.','error'); return; }
  if (!confirm('공지사항을 삭제할까요?')) return;
  await deleteDoc(doc(db,'notices',id));
  loadNotices();
  if (document.getElementById('panel-notices').classList.contains('active')) loadConsoleNotices();
  toast('삭제되었습니다.','info');
}

// ── 사이트 배너 ───────────────────────────────────────────────────────────────
const BANNER_LS = 'astro_banner';

async function loadBanner() {
  try {
    const snap = await getDoc(doc(db,'config','site_banner'));
    if (!snap.exists() || !snap.data().active) return;
    const data = snap.data();
    const bid  = data.updatedAt ? String(data.updatedAt.toMillis()) : 'x';
    const stored = localStorage.getItem(`${BANNER_LS}_${bid}`);
    if (stored && Date.now() < parseInt(stored,10)) return;
    renderBanner(data, bid);
  } catch {}
}

function renderBanner(data, bid) {
  const el = document.getElementById('site-banner');
  const typeMap = { info:{cls:'banner-info',icon:'ℹ️'}, warning:{cls:'banner-warning',icon:'⚠️'}, danger:{cls:'banner-danger',icon:'🚨'} };
  const t = typeMap[data.type] || typeMap.info;
  el.className = t.cls;
  document.getElementById('banner-icon').textContent = t.icon;
  document.getElementById('banner-text').textContent = data.message;
  el.style.display = 'flex';
  document.getElementById('banner-dismiss-today').style.display = data.dismissible!==false ? 'inline' : 'none';
  document.getElementById('banner-dismiss-today').onclick = () => {
    const m = new Date(); m.setHours(23,59,59,999);
    localStorage.setItem(`${BANNER_LS}_${bid}`, String(m.getTime()));
    el.style.display = 'none';
  };
  document.getElementById('banner-close').onclick = () => { el.style.display='none'; };
}

async function saveBanner(data) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 배너를 설정할 수 있습니다.','error'); return; }
  await setDoc(doc(db,'config','site_banner'), { ...data, updatedAt:serverTimestamp() });
  toast('배너가 게시되었습니다.','success');
  loadBanner();
  refreshBannerInfo();
}

async function removeBanner() {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 배너를 제거할 수 있습니다.','error'); return; }
  if (!confirm('배너를 제거할까요?')) return;
  await setDoc(doc(db,'config','site_banner'), { active:false, updatedAt:serverTimestamp() });
  document.getElementById('site-banner').style.display = 'none';
  toast('배너가 제거되었습니다.','info');
  refreshBannerInfo();
}

async function refreshBannerInfo() {
  const el = document.getElementById('current-banner-info');
  if (!el) return;
  try {
    const snap = await getDoc(doc(db,'config','site_banner'));
    if (!snap.exists() || !snap.data().active) { el.innerHTML = '<span style="color:var(--gray);">현재 활성 배너 없음</span>'; return; }
    const d = snap.data();
    const labels = {info:'안내',warning:'경고',danger:'긴급'};
    el.innerHTML = `<strong>유형:</strong> ${labels[d.type]||d.type} &nbsp;|&nbsp; <strong>메시지:</strong> ${esc(d.message)} &nbsp;|&nbsp; <strong>오늘하루보지않기:</strong> ${d.dismissible!==false?'표시':'미표시'}`;
  } catch { el.textContent = '불러오기 실패'; }
}

// ── 관리자 관리 ───────────────────────────────────────────────────────────────
async function loadAdmins() {
  const el = document.getElementById('console-admin-list');
  el.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';
  const items = OWNER_EMAILS.map(e => ({ email:e, role:'owner' }));
  try {
    const snap = await getDocs(collection(db,'admins'));
    snap.forEach(d => { if (!OWNER_EMAILS.includes(d.id)) items.push({email:d.id,role:'admin'}); });
  } catch {}
  el.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <div class="admin-avatar${item.role==='owner'?' owner':''}">${item.email[0].toUpperCase()}</div>
      <div class="admin-info">
        <div class="admin-email">${esc(item.email)}</div>
        <div class="admin-role-sub">${item.role==='owner'?'모든 권한':'공지 CRUD'}</div>
      </div>
      <span class="role-badge ${item.role}">${item.role==='owner'?'운영담당자':'관리자'}</span>
      ${item.role==='admin'?`<button class="btn btn-xs btn-outline" style="color:var(--red);border-color:var(--red);" data-email="${esc(item.email)}">해제</button>`:''}`;
    el.appendChild(row);
  });
  el.querySelectorAll('[data-email]').forEach(b => b.addEventListener('click', () => revokeAdmin(b.dataset.email)));
}

async function addAdmin(email) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 관리자를 추가할 수 있습니다.','error'); return; }
  email = email.trim().toLowerCase();
  if (!email.includes('@')) { document.getElementById('admin-add-error').textContent='올바른 이메일 형식을 입력하세요.'; return; }
  if (OWNER_EMAILS.includes(email)) { document.getElementById('admin-add-error').textContent='운영담당자 이메일은 추가할 수 없습니다.'; return; }
  try {
    await setDoc(doc(db,'admins',email), { addedBy:auth.currentUser.email, addedAt:serverTimestamp() });
    _adminSet = null;
    document.getElementById('admin-add-error').textContent = '';
    document.getElementById('new-admin-email').value = '';
    toast(`${email} 을 관리자로 추가했습니다.`,'success');
    loadAdmins(); loadConsoleStats();
  } catch(e) { document.getElementById('admin-add-error').textContent='추가 실패: '+e.message; }
}

async function revokeAdmin(email) {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 해제할 수 있습니다.','error'); return; }
  if (!confirm(`${email} 의 관리자 권한을 해제할까요?`)) return;
  try {
    await deleteDoc(doc(db,'admins',email));
    _adminSet = null;
    toast('관리자 권한이 해제되었습니다.','info');
    loadAdmins(); loadConsoleStats();
  } catch(e) { toast('해제 실패: '+e.message,'error'); }
}

// ── 질문 설정 ─────────────────────────────────────────────────────────────────
async function loadQuestions() {
  try {
    const snap = await getDoc(doc(db,'config','apply_questions'));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById('q1-input').value = d.q1 || '';
      document.getElementById('q2-input').value = d.q2 || '';
    }
  } catch {}
}

async function saveQuestions() {
  if (!isOwner(auth.currentUser)) { toast('운영담당자만 설정할 수 있습니다.','error'); return; }
  const q1 = document.getElementById('q1-input').value.trim();
  const q2 = document.getElementById('q2-input').value.trim();
  if (!q1 || !q2) { toast('질문 1, 2를 모두 입력해주세요.','error'); return; }
  try {
    await setDoc(doc(db,'config','apply_questions'), { q1, q2, updatedAt:serverTimestamp() });
    document.getElementById('questions-status').textContent = '✓ 저장되었습니다.';
    setTimeout(() => { document.getElementById('questions-status').textContent=''; }, 3000);
    toast('질문이 저장되었습니다.','success');
  } catch(e) { toast('저장 실패: '+e.message,'error'); }
}

// ── 콘솔 공지 목록 ────────────────────────────────────────────────────────────
async function loadConsoleNotices() {
  const el = document.getElementById('console-notice-list');
  el.innerHTML = '<div style="color:var(--gray);font-size:0.85rem;">불러오는 중...</div>';
  try {
    const snap = await getDocs(query(collection(db,'notices'),orderBy('createdAt','desc')));
    if (snap.empty) { el.innerHTML='<div style="color:var(--gray);font-size:0.85rem;padding:0.5rem 0;">등록된 공지사항이 없습니다.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(d => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.85rem;border:1px solid var(--border);border-radius:8px;font-size:0.85rem;';
      row.innerHTML = `<span style="flex:1;color:var(--ink);">${esc(d.data().title)}</span><span style="color:var(--gray);font-size:0.75rem;">${fmtDate(d.data().createdAt)}</span><button class="btn btn-xs btn-outline" style="color:var(--red);border-color:var(--red);" data-id="${d.id}">삭제</button>`;
      row.querySelector('button').addEventListener('click', () => deleteNotice(d.id));
      el.appendChild(row);
    });
  } catch(e) { el.innerHTML=`<div style="color:var(--red);font-size:0.85rem;">오류: ${e.message}</div>`; }
}

// ── 콘솔 통계 ─────────────────────────────────────────────────────────────────
async function loadConsoleStats() {
  try {
    const [ns, as, ads] = await Promise.all([
      getDocs(collection(db,'notices')),
      getDocs(collection(db,'applications')),
      getDocs(collection(db,'admins'))
    ]);
    document.getElementById('stat-notices').textContent    = ns.size;
    document.getElementById('stat-applicants').textContent = as.size;
    let pend = 0; as.forEach(d => { if ((d.data().status||'pending')==='pending') pend++; });
    document.getElementById('stat-pending').textContent = pend;
    const aEmails = new Set(ads.docs.map(d=>d.id).filter(e=>!OWNER_EMAILS.includes(e)));
    document.getElementById('stat-admins').textContent = aEmails.size;
  } catch {}
}

// ── 콘솔 탭 전환 ──────────────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.console-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===id));
  document.querySelectorAll('.console-panel').forEach(p => p.classList.toggle('active', p.id===`panel-${id}`));
  if (id==='admins') loadAdmins();
  if (id==='banner') refreshBannerInfo();
  if (id==='questions') loadQuestions();
  if (id==='notices') loadConsoleNotices();
  if (id==='overview') loadConsoleStats();
}
window.switchTab = switchTab;

// ── Auth 상태 ─────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  const loginBtn    = document.getElementById('login-btn');
  const menuWrap    = document.getElementById('user-menu-wrap');
  const userInfo    = document.getElementById('user-info');
  const adminPanel  = document.getElementById('admin-panel');
  const consoleBtn  = document.getElementById('open-console-btn');
  const consoleDiv  = document.getElementById('console-divider');

  if (user) {
    loginBtn.style.display = 'none';
    menuWrap.style.display = 'flex';
    const name = user.displayName || user.email;
    const owner = isOwner(user);
    const admin = await checkAdmin(user);
    userInfo.textContent = owner ? `👑 ${name}` : admin ? `💻 ${name}` : name;
    userInfo.style.display = 'inline';
    consoleBtn.style.display = owner ? 'block' : 'none';
    consoleDiv.style.display  = owner ? 'block' : 'none';
    if (adminPanel) adminPanel.style.display = admin ? 'block' : 'none';
  } else {
    loginBtn.style.display = 'inline-block';
    menuWrap.style.display = 'none';
    userInfo.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
  }
  updateDelBtns();
});

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  loadBanner();

  // 드롭다운
  const menuBtn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  menuBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
  document.addEventListener('click', () => dropdown.classList.remove('open'));

  // 로그인
  document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));

  // 로그아웃
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth); toast('로그아웃되었습니다.','info'); dropdown.classList.remove('open');
  });

  // 콘솔 열기
  document.getElementById('open-console-btn').addEventListener('click', () => {
    dropdown.classList.remove('open'); openModal('console-modal'); loadConsoleStats();
  });

  // 모달 닫기
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeAllModals));
  document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if(e.target===o) closeAllModals(); }));

  // 이메일 로그인
  document.getElementById('email-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('login-error');
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pw').value);
      closeAllModals(); toast('로그인되었습니다.','success');
    } catch(ex) { err.textContent = '로그인 실패: '+translateAuthError(ex.code); }
  });

  // 구글 로그인
  document.getElementById('google-login-btn').addEventListener('click', async () => {
    try { await signInWithPopup(auth,gp); closeAllModals(); toast('Google 로그인 성공','success'); }
    catch(ex) { document.getElementById('login-error').textContent = translateAuthError(ex.code); }
  });

  // 회원가입 탭 전환
  document.getElementById('go-signup').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('login-tab').style.display='none'; document.getElementById('signup-tab').style.display='block'; document.getElementById('login-error').textContent='';
  });
  document.getElementById('go-login').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('signup-tab').style.display='none'; document.getElementById('login-tab').style.display='block';
  });

  // 회원가입
  document.getElementById('email-signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, document.getElementById('signup-email').value, document.getElementById('signup-pw').value);
      closeAllModals(); toast('가입이 완료되었습니다.','success');
    } catch(ex) { document.getElementById('signup-error').textContent='가입 실패: '+translateAuthError(ex.code); }
  });

  // 공지 추가 (관리자 패널)
  document.getElementById('notice-add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = document.getElementById('notice-input');
    const btn = e.submitter;
    btn.disabled=true; btn.textContent='저장 중...';
    await addNotice(inp.value);
    inp.value=''; btn.disabled=false; btn.textContent='등록';
  });

  // 공지 삭제 이벤트
  document.getElementById('notice-list').addEventListener('click', e => {
    const b = e.target.closest('.notice-del-btn');
    if (b) deleteNotice(b.dataset.id);
  });

  // 콘솔 탭 클릭
  document.querySelectorAll('.console-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // 관리자 추가
  document.getElementById('add-admin-btn').addEventListener('click', () => addAdmin(document.getElementById('new-admin-email').value));
  document.getElementById('new-admin-email').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();addAdmin(e.target.value);} });

  // 배너 유형
  document.querySelectorAll('.banner-type-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.banner-type-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); updateBannerPreview();
  }));
  document.getElementById('banner-msg-input').addEventListener('input', updateBannerPreview);

  function updateBannerPreview() {
    const msg = document.getElementById('banner-msg-input').value;
    const type = document.querySelector('.banner-type-btn.selected')?.dataset.type||'info';
    const prev = document.getElementById('banner-preview-box');
    const tm = {info:{cls:'banner-info',icon:'ℹ️'},warning:{cls:'banner-warning',icon:'⚠️'},danger:{cls:'banner-danger',icon:'🚨'}};
    if (msg.trim()) {
      prev.className = `banner-preview visible ${tm[type].cls}`;
      document.getElementById('preview-icon').textContent = tm[type].icon;
      document.getElementById('preview-text').textContent = msg;
    } else { prev.className = 'banner-preview'; }
  }

  document.getElementById('save-banner-btn').addEventListener('click', async () => {
    const msg = document.getElementById('banner-msg-input').value.trim();
    if (!msg) { toast('배너 메시지를 입력하세요.','error'); return; }
    await saveBanner({ active:true, message:msg, type:document.querySelector('.banner-type-btn.selected')?.dataset.type||'info', dismissible:document.getElementById('banner-dismissible').checked });
  });

  document.getElementById('remove-banner-btn').addEventListener('click', removeBanner);

  // 질문 저장
  document.getElementById('save-questions-btn').addEventListener('click', saveQuestions);

  // 콘솔 공지 추가
  const cni = document.getElementById('console-notice-input');
  document.getElementById('console-add-notice-btn').addEventListener('click', async () => {
    await addNotice(cni.value); cni.value=''; loadConsoleNotices(); loadConsoleStats();
  });
  cni.addEventListener('keydown', async e => {
    if (e.key==='Enter') { e.preventDefault(); await addNotice(cni.value); cni.value=''; loadConsoleNotices(); loadConsoleStats(); }
  });
});
이게 main.js 이고
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
이게 firebase-config.js 이야.

1. apply.html 파일 코드를 만들어줘

2. apply_info.html 파일 코드를 만들어줘

3. 운영자 콘솔에서 탭 버튼을 눌렀을 때 다른 탭으로 이동하지 않아. 



   apply.html 이라는 새로운 파일이 필요하겠지? 일단 여기서는 학번, 이름, 전화번호, 이메일, 자기소개, 지원동기, 질문 1, 질문2, 하고 싶은 말 이렇게 입력 칸을 만들고 마지막에 제출하기 버튼을 만들어. 그리고 운영자 콘솔에서 질문1과 질문2를 설정할 수 있게 만들어줘. 그리고 운영자 콘솔에 신청자 목록 탭을 가입 신청이라고 바꾸고 탭에는 다른 기능 말고 /apply_info.html 이라는 운영자용 페이지로 이동하는 버튼만 둬. 그리고 당연히 apply_info.html 이라는 새로운 html 파일을 만들어야 겠지? 거기 들어가면 일단 신청자 목록이 나열되어 있고, 전체 인원 수등 정보들을 보여줘. 그리고 신청자 목록에서 신청자를 클릭하면 모달이 뜨면서 신청자가 입력한 것들을 보여주는 거야. 그리고 이 창에는 전체 가입 신청 삭제, 부분 삭제 등의 기능을 넣어줘. 또한 신청자들 바로 옆에 합격/불합격 버튼을 만들어서 합격 불합격을 가리게 하고, 합격자 탭과 불합격자 탭을 만들어줘. 그리고 각 탭에서 합격자들의 학번 이름과 전화번호 등을 마찬가지로 보여줘



그리고 apply.html / apply_info.html 페이지의 디자인은 기존 메인 페이지 디자인과 비슷하게 해줘
