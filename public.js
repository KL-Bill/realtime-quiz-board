const socket = io(window.APP_CONFIG.BACKEND_URL, {
  transports: ["websocket", "polling"]
});

const connBadge = document.getElementById("connBadge");
const qText = document.getElementById("qText");
const grid = document.getElementById("grid");

const answerBox = document.getElementById("answerBox");
const correctAnswer = document.getElementById("correctAnswer");

function setConn(ok) {
  connBadge.className = "badge dot " + (ok ? "ok" : "");
  connBadge.textContent = ok ? "Connected" : "Disconnected";
}
socket.on("connect", () => { setConn(true); socket.emit("publicHello"); });
socket.on("disconnect", () => setConn(false));

function tileFor(g, revealResults) {
  let pill = "idle";
  let label = "Waiting";

  if (g.submitted) { pill = "submitted"; label = "Submitted"; }
  if (revealResults) {
    if (g.status === "correct") { pill = "correct"; label = "Correct"; }
    else if (g.status === "wrong") { pill = "wrong"; label = "Wrong"; }
    else if (g.submitted) { pill = "submitted"; label = "Submitted"; }
  }

  const online = g.connected ? "Online" : "Offline";
  return `
    <div class="tile">
      <div class="left">
        <div class="num">Group ${g.groupNumber}</div>
        <div class="sub">${online} • Score: <b>${g.score}</b></div>
      </div>
      <span class="pill ${pill}">${label}</span>
    </div>
  `;
}

socket.on("state", (s) => {
  qText.textContent = s.questionText ? s.questionText : "Waiting for admin…";

  if (s.revealAnswer && s.correctAnswer) {
    answerBox.style.display = "block";
    correctAnswer.textContent = s.correctAnswer;
  } else {
    answerBox.style.display = "none";
  }

  // populate only after group connects/submits/has score
  const groups = Object.values(s.groups)
    .filter(g => g.connected || g.submitted || g.score > 0)
    .sort((a,b)=>a.groupNumber-b.groupNumber);

  // Force your 2-column order: odd left, even right.
  const left = groups.filter(g => g.groupNumber % 2 === 1);
  const right = groups.filter(g => g.groupNumber % 2 === 0);
  const merged = [];
  const rows = Math.max(left.length, right.length);
  for (let i=0; i<rows; i++) {
    if (left[i]) merged.push(left[i]);
    if (right[i]) merged.push(right[i]);
  }

  grid.innerHTML = merged.map(g => tileFor(g, s.revealResults)).join("");
  grid.classList.add("flash");
  setTimeout(()=>grid.classList.remove("flash"), 120);
});
