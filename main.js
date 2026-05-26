import {
  auth,
  provider,
  db,
  signInWithPopup,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
}
from "./firebase.js";

const loginBtn = document.getElementById("loginBtn");

const writeNoticeBtn =
document.getElementById("writeNoticeBtn");

const noticeModal =
document.getElementById("noticeModal");

const submitNotice =
document.getElementById("submitNotice");

const noticeList =
document.getElementById("noticeList");

/* 관리자 이메일 */

const ADMIN_EMAIL = "your-email@gmail.com";

/* 로그인 */

loginBtn.addEventListener("click", async () => {

  const result = await signInWithPopup(auth, provider);

  const user = result.user;

  if(user.email === ADMIN_EMAIL){

    alert("관리자 로그인 성공");

    writeNoticeBtn.classList.remove("hidden");

  }else{

    alert("관리자 계정이 아닙니다.");

  }

});

/* 공지 작성 */

writeNoticeBtn.addEventListener("click", () => {

  noticeModal.classList.remove("hidden");

});

/* 공지 업로드 */

submitNotice.addEventListener("click", async () => {

  const title =
  document.getElementById("noticeTitle").value;

  const content =
  document.getElementById("noticeContent").value;

  if(!title || !content){

    alert("모든 내용을 입력하세요.");

    return;

  }

  await addDoc(collection(db,"notices"),{

    title,
    content,
    createdAt:serverTimestamp()

  });

  alert("공지 업로드 완료");

  location.reload();

});

/* 공지 불러오기 */

async function loadNotices(){

  const snapshot =
  await getDocs(collection(db,"notices"));

  noticeList.innerHTML = "";

  snapshot.forEach(doc => {

    const notice = doc.data();

    const div =
    document.createElement("div");

    div.className = "notice-item";

    div.innerHTML = `

      <h3>${notice.title}</h3>

      <p>${notice.content}</p>

    `;

    noticeList.appendChild(div);

  });

}

loadNotices();
