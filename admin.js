const socket = io(window.APP_CONFIG.BACKEND_URL, {
  transports: ["websocket", "polling"]
});

const connBadge = document.getElementById("connBadge");
const authCard = document.getElementById("authCard");
const adminCard = document.getElementById("adminCard");

const code = document.getElementById("code");
const authBtn = document.getElementById("authBtn");
const authMsg = document.getElementById("authMsg");

const roundId = document.getElementById("roundId");
const questionText = document.getElementById("questionText");
const correctAnswer = document.getElementById("correctAnswer");
const saveQBtn = document.getElementById("saveQBtn");
const saveMsg = document.getElementById("saveMsg");

const revealAnswerBtn = document.getElementById("revealAnswerBtn");
const revealResultsBtn = document.getElementById("revealResultsBtn");
const resetBtn = document.getElementById("resetBtn");

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
resetBtn.addEventListener("click", () => {
  if (!confirm("Reset round? This unlocks all groups for next question.")) return;
  socket.emit("adminResetRound");
});

function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderGroups(s) {
  const groups = Object.values(s.groups).sort((a,b)=>a.groupNumber-b.groupNumber);

  const submittedCount = groups.filter(g=>g.submitted).length;
  const connectedCount = groups.filter(g=>g.connected).length;

  statsBadge.className = "badge dot";
  statsBadge.textContent = `${connectedCount} connected • ${submittedCount} submitted`;

  groupsList.innerHTML = groups.map(g => {
    const statusPill =
      g.status === "correct" ? `<span class="pill correct">Correct</span>` :
      g.status === "wrong" ? `<span class="pill wrong">Wrong</span>` :
      g.submitted ? `<span class="pill submitted">Submitted</span>` :
      `<span class="pill idle">Waiting</span>`;

    const conn = g.connected ? "✅ Online" : "⚪ Offline";
    const ans = g.answer
      ? `<div class="answerBox"><div class="small">Answer:</div><div style="font-size:16px;font-weight:800;margin-top:6px">${escapeHtml(g.answer)}</div></div>`
      : `<div class="answerBox"><div class="small">No answer yet.</div></div>`;

    return `
      <div class="card" style="margin-top:12px;">
        <div class="row" style="justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:18px;font-weight:900;">Group ${g.groupNumber} <span class="small">• ${conn}</span></div>
            <div class="small">Score: <b>${g.score}</b></div>
          </div>
          <div class="row">
            ${statusPill}
            <button class="ok" data-action="correct" data-g="${g.groupNumber}" ${!g.submitted ? "disabled" : ""}>Mark Correct</button>
            <button class="danger" data-action="wrong" data-g="${g.groupNumber}" ${!g.submitted ? "disabled" : ""}>Mark Wrong</button>
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
  roundId.textContent = s.roundId;
  questionText.value = s.questionText;
  correctAnswer.value = s.correctAnswer;

  revealAnswerBtn.textContent = s.revealAnswer ? "Answer Revealed ✅" : "Reveal Answer (Public)";
  revealResultsBtn.textContent = s.revealResults ? "Results Revealed ✅" : "Reveal Correct/Wrong (Public)";

  renderGroups(s);
});
