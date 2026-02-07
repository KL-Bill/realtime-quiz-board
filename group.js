const socket = io(window.APP_CONFIG.BACKEND_URL, {
  transports: ["websocket", "polling"]
});

const connBadge = document.getElementById("connBadge");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");

const groupNum = document.getElementById("groupNum");
const joinBtn = document.getElementById("joinBtn");
const joinMsg = document.getElementById("joinMsg");

const gLabel = document.getElementById("gLabel");
const qText = document.getElementById("qText");

const answer = document.getElementById("answer");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const err = document.getElementById("err");

const statusBadge = document.getElementById("statusBadge");

const revealArea = document.getElementById("revealArea");
const revealedAnswer = document.getElementById("revealedAnswer");

const resultArea = document.getElementById("resultArea");
const resultText = document.getElementById("resultText");

let myGroup = null;
let lastRoundId = null;

function setConn(ok) {
  connBadge.className = "badge dot " + (ok ? "ok" : "");
  connBadge.textContent = ok ? "Connected" : "Disconnected";
}

socket.on("connect", () => setConn(true));
socket.on("disconnect", () => setConn(false));

function enterGroup(n) {
  myGroup = n;
  localStorage.setItem("groupNumber", String(n));
  socket.emit("registerGroup", { groupNumber: n });
  gLabel.textContent = n;
  step1.style.display = "none";
  step2.style.display = "block";
}

joinBtn.addEventListener("click", () => {
  const n = Number(groupNum.value);
  if (!Number.isInteger(n) || n < 1 || n > (window.APP_CONFIG.MAX_GROUPS || 10)) {
    joinMsg.textContent = `Please enter a valid group number (1-${window.APP_CONFIG.MAX_GROUPS || 10}).`;
    return;
  }
  enterGroup(n);
});

// auto-fill from localStorage if set
const saved = localStorage.getItem("groupNumber");
if (saved && Number.isInteger(Number(saved))) {
  groupNum.value = saved;
  // don't auto-enter until socket connects, but it’s okay to do it immediately
  enterGroup(Number(saved));
}

clearBtn.addEventListener("click", () => {
  answer.value = "";
  err.textContent = "";
});

submitBtn.addEventListener("click", () => {
  err.textContent = "";
  socket.emit("submitAnswer", { answer: answer.value });
});

socket.on("errorMsg", (msg) => {
  err.textContent = msg;
});

socket.on("state", (s) => {
  if (!myGroup) return;

  // detect reset
  if (lastRoundId !== null && s.roundId !== lastRoundId) {
    answer.value = "";
    err.textContent = "";
    resultArea.style.display = "none";
    revealArea.style.display = "none";
  }
  lastRoundId = s.roundId;

  qText.textContent = s.questionText ? s.questionText : "Waiting for admin question…";

  const g = s.groups[String(myGroup)] || s.groups[myGroup];
  if (!g) return;

  submitBtn.disabled = !!g.submitted;
  answer.disabled = !!g.submitted;

  if (g.submitted) {
    statusBadge.className = "badge dot warn";
    statusBadge.textContent = "Submitted";
  } else {
    statusBadge.className = "badge dot ok";
    statusBadge.textContent = "Ready";
  }

  if (s.revealAnswer && s.correctAnswer) {
    revealArea.style.display = "block";
    revealedAnswer.textContent = s.correctAnswer;
  } else {
    revealArea.style.display = "none";
  }

  if (s.revealResults) {
    resultArea.style.display = "block";
    if (g.status === "correct") resultText.textContent = "✅ Correct!";
    else if (g.status === "wrong") resultText.textContent = "❌ Wrong";
    else resultText.textContent = "⏳ Pending";
  } else {
    resultArea.style.display = "none";
  }
});
