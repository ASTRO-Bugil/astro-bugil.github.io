```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>가입 신청 관리</title>

<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">

<style>
body{
  font-family:'Noto Sans KR',sans-serif;
  margin:0;
  background:#fff;
  color:#1e293b;
}

header{
  padding:24px 6%;
  border-bottom:1px solid #e2e8f0;
}

.container{
  padding:40px 6%;
}

.stats{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:1rem;
  margin-bottom:2rem;
}

.card{
  border:1px solid #e2e8f0;
  border-radius:14px;
  padding:1.2rem;
}

.value{
  font-size:2rem;
  font-weight:700;
}

.label{
  color:#64748b;
}

.tabs{
  display:flex;
  gap:.5rem;
  margin-bottom:1rem;
}

.tab{
  border:none;
  padding:.7rem 1.1rem;
  border-radius:10px;
  cursor:pointer;
}

.tab.active{
  background:#3b82f6;
  color:white;
}

.list{
  display:flex;
  flex-direction:column;
  gap:.75rem;
}

.item{
  border:1px solid #e2e8f0;
  border-radius:14px;
  padding:1rem;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.left{
  cursor:pointer;
}

.name{
  font-weight:700;
}

.sub{
  color:#64748b;
  font-size:.9rem;
}

.actions{
  display:flex;
  gap:.5rem;
}

.btn{
  border:none;
  padding:.55rem .9rem;
  border-radius:8px;
  cursor:pointer;
}

.pass{
  background:#10b981;
  color:white;
}

.fail{
  background:#dc2626;
  color:white;
}

.delete{
  background:#e2e8f0;
}

.modal-wrap{
  display:none;
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.5);
  align-items:center;
  justify-content:center;
}

.modal{
  background:white;
  width:90%;
  max-width:700px;
  border-radius:18px;
  padding:2rem;
  max-height:90vh;
  overflow:auto;
}

pre{
  white-space:pre-wrap;
  line-height:1.7;
}
</style>
</head>

<body>

<header>
  <h1>📋 가입 신청 관리</h1>
</header>

<div class="container">

  <div class="stats">

    <div class="card">
      <div class="value" id="totalCount">0</div>
      <div class="label">전체</div>
    </div>

    <div class="card">
      <div class="value" id="pendingCount">0</div>
      <div class="label">대기</div>
    </div>

    <div class="card">
      <div class="value" id="passCount">0</div>
      <div class="label">합격</div>
    </div>

    <div class="card">
      <div class="value" id="failCount">0</div>
      <div class="label">불합격</div>
    </div>

  </div>

  <div class="tabs">
    <button class="tab active" data-status="all">전체</button>
    <button class="tab" data-status="pending">대기</button>
    <button class="tab" data-status="accepted">합격</button>
    <button class="tab" data-status="rejected">불합격</button>
  </div>

  <div class="list" id="list"></div>

</div>

<div class="modal-wrap" id="modalWrap">
  <div class="modal">
    <h2 id="modalTitle"></h2>
    <pre id="modalContent"></pre>
  </div>
</div>

<script type="module" src="apply_info.js"></script>

</body>
</html>
```
