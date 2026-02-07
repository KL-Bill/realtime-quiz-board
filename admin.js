const socket = io(window.APP_CONFIG.BACKEND_URL, {
  transports: ["websocket", "polling"]
});

const connBadge = document.getElementById("connBadge");
const authCard = document.getElementById("authCard");
const adminCard = document.getElementById("adminCard");

const code = document.getElementById("code");
const authBtn = document.getElementById("authBtn");
const authMsg = document.getElementById("authMsg");

const modeTimer = document.getElementById("modeTimer");
const timerControls = document.getElementById("timerControls");
const timerSec = document.getElementById("timerSec");

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const resetBtn = document.getElementById("resetBtn");

const questionText = document.getElementById("questionText");
const correctAnswer = document.getElementById("correctAnswer");
const saveQBtn = document.getElementById("saveQBtn");
const saveMsg = document.getElementById("saveMsg");

const revealAnswerBtn = document.getElementById("revealAnswerBtn");
const revealResultsBtn = document.getElementById("revealResultsBtn");

const groupsList = document.getElementById("groupsList");
const statsBadge = document.getElementById("statsBadge");

function setConn(ok) {
  connBadge.className = "badge dot " + (ok ? "ok" : "");
  connBadge.textContent = ok ? "Connected" : "Disconnected";
}
socket.on("connect", () => setConn(true));
socket.on("disconnect", () => setConn(false));

authBtn.addEventListener("click", () => {
  socket.emit("adminAuth", { code: code.value });
});

socket.on("adminAuthResult", ({ ok, message }) => {
  authMsg.textContent = message;
  if (ok) {
    authCard.style.display = "none";
    adminCard.style.display = "block";
  }
});

modeTimer.addEventListener("change", () => {
  const mode = modeTimer.checked ? "timer" : "rank";
  socket.emit("adminSetMode", { mode });
});

timerSec.addEventListener("change", () => {
  socket.emit("adminSetTimer", { seconds: Number(timerSec.value) });
});

startBtn.addEventListener("click", () => socket.emit("adminStartCountdown"));
endBtn.addEventListener("click", () => socket.emit("adminEndSubmission"));
resetBtn.addEventListener("click", () => {
  if (!confirm("Reset round?")) return;
  socket.emit("adminResetRound");
});

saveQBtn.addEventListener("click", () => {
  saveMsg.textContent = "Saving…";
  socket.emit("adminSetQuestion", {
    questionText: questionText.value,
    correctAnswer: correctAnswer.value
  });
  setTimeout(() => (saveMsg.textContent = "Saved."), 220);
});

revealAnswerBtn.addEventListener("click", () => socket.emit("adminRevealAnswer"));
revealResultsBtn.addEventListener("click", () => socket.emit("adminRevealResults"));

function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderGroups(s) {
  const groups = Object.values(s.groups).sort((a,b)=>a.groupNumber-b.groupNumber);

  const submittedCount = groups.filter(g=>g.submitted).length;
  const connectedCount = groups.filter(g=>g.connected).length;

  statsBadge.className = "badge dot";
  statsBadge.textContent = `${connectedCount} online • ${submittedCount} submitted`;

  groupsList.innerHTML = groups.map(g => {
    const conn = g.connected ? "Online" : "Offline";
    const submitted = g.submitted ? "Submitted" : "—";
    const statusPill =
      g.status === "correct" ? `<span class="pill correct">Correct</span>` :
      g.status === "wrong" ? `<span class="pill wrong">Wrong</span>` :
      g.submitted ? `<span class="pill submitted">Submitted</span>` :
      `<span class="pill idle">Waiting</span>`;

    const rank = (s.mode === "rank" && g.submitted && Number.isFinite(g.rank)) ? `#${g.rank}` : "";

    const ans = g.answer
      ? `<div class="answerBox"><div class="small">Answer:</div><div style="font-size:16px;font-weight:800;margin-top:6px">${escapeHtml(g.answer)}</div></div>`
      : "";

    return `
      <div class="card" style="margin-top:12px;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:18px;font-weight:900;">${rank ? `<span style="opacity:.8;margin-right:8px">${rank}</span>` : ""}Group ${g.groupNumber}</div>
            <div class="small">${conn}</div>
          </div>
          <div class="row">
            ${statusPill}
            <button class="ok" data-action="correct" data-g="${g.groupNumber}" ${!g.submitted ? "disabled" : ""}>Correct</button>
            <button class="danger" data-action="wrong" data-g="${g.groupNumber}" ${!g.submitted ? "disabled" : ""}>Wrong</button>
            <button class="secondary" data-action="pending" data-g="${g.groupNumber}" ${!g.submitted ? "disabled" : ""}>Pending</button>
          </div>
        </div>
        ${ans}
      </div>
    `;
  }).join("");

  groupsList.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      socket.emit("adminMarkGroup", {
        groupNumber: Number(btn.dataset.g),
        status: btn.dataset.action
      });
    });
  });
}

socket.on("adminState", (s) => {
  questionText.value = s.questionText;
  correctAnswer.value = s.correctAnswer;

  modeTimer.checked = (s.mode === "timer");
  timerControls.style.display = (s.mode === "timer") ? "flex" : "none";
  startBtn.disabled = (s.mode !== "timer") || !s.submissionOpen;
  endBtn.disabled = !s.submissionOpen;

  timerSec.value = s.countdownSeconds || 30;

  revealAnswerBtn.textContent = s.revealAnswer ? "Answer Revealed ✅" : "Reveal Answer";
  revealResultsBtn.textContent = s.revealResults ? "Results Revealed ✅" : "Reveal Correct/Wrong";

  // compute ranks if rank mode
  if (s.mode === "rank") {
    const submitted = Object.values(s.groups)
      .filter(g => g.submitted && Number.isFinite(g.submittedAt))
      .sort((a,b)=>a.submittedAt-b.submittedAt);
    const rankMap = new Map();
    submitted.forEach((g,i)=>rankMap.set(g.groupNumber, i+1));
    for (const g of Object.values(s.groups)) g.rank = rankMap.get(g.groupNumber);
  }

  renderGroups(s);
});
