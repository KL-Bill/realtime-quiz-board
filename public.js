const socket = io(window.APP_CONFIG.BACKEND_URL, {
  transports: ["websocket", "polling"]
});

const connBadge = document.getElementById("connBadge");
const qText = document.getElementById("qText");
const grid = document.getElementById("grid");
const answerBox = document.getElementById("answerBox");
const correctAnswer = document.getElementById("correctAnswer");
const timerWrap = document.getElementById("timerWrap");
const timerEl = document.getElementById("timer");
const modeLabel = document.getElementById("modeLabel");

let lastState = null;

function setConn(ok) {
  connBadge.className = "badge dot " + (ok ? "ok" : "");
  connBadge.textContent = ok ? "Connected" : "Disconnected";
}
socket.on("connect", () => { setConn(true); socket.emit("publicHello"); });
socket.on("disconnect", () => setConn(false));

function pad(n){ return String(n).padStart(2,"0"); }
function fmtTime(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s%60;
  return `${pad(m)}:${pad(r)}`;
}

function tileFor(g, revealResults, mode) {
  let pill = "idle";
  let label = "Waiting";
  let tileClass = "tile";

  if (g.submitted) { pill = "submitted"; label = "Submitted"; tileClass += " submitted"; }
  if (revealResults) {
    if (g.status === "correct") { pill = "correct"; label = "Correct"; tileClass += " correct"; }
    else if (g.status === "wrong") { pill = "wrong"; label = "Wrong"; tileClass += " wrong"; }
  }

  const rankText = (mode === "rank" && g.submitted && Number.isFinite(g.rank)) ? `#${g.rank}` : "";

  return `
    <div class="${tileClass}">
      <div class="left">
        <div class="num">${rankText ? `<span style="opacity:.8;margin-right:8px">${rankText}</span>` : ""}Group ${g.groupNumber}</div>
        <div class="sub">${g.connected ? "Online" : "Offline"}</div>
      </div>
      <span class="pill ${pill}">${label}</span>
    </div>
  `;
}

function render(s){
  qText.textContent = s.questionText ? s.questionText : "Waiting…";

  // Answer reveal
  if (s.revealAnswer && s.correctAnswer) {
    answerBox.style.display = "block";
    correctAnswer.textContent = s.correctAnswer;
  } else {
    answerBox.style.display = "none";
  }

  // Mode label + timer visibility
  if (s.mode === "timer") {
    modeLabel.textContent = "Timed mode";
    timerWrap.style.display = "block";
  } else {
    modeLabel.textContent = "Rank mode";
    timerWrap.style.display = "none";
  }

  // groups: show only those known (connected/submitted)
  let groups = Object.values(s.groups)
    .filter(g => g.connected || g.submitted)
    .sort((a,b)=>a.groupNumber-b.groupNumber);

  if (s.mode === "rank") {
    // show submitted first by submittedAt asc
    groups.sort((a,b)=>{
      const as = a.submitted ? 0 : 1;
      const bs = b.submitted ? 0 : 1;
      if (as !== bs) return as - bs;
      const at = a.submittedAt || Infinity;
      const bt = b.submittedAt || Infinity;
      if (at !== bt) return at - bt;
      return a.groupNumber - b.groupNumber;
    });
  } else {
    // keep your 2-column order: odds then evens
    const left = groups.filter(g => g.groupNumber % 2 === 1);
    const right = groups.filter(g => g.groupNumber % 2 === 0);
    const merged = [];
    const rows = Math.max(left.length, right.length);
    for (let i=0; i<rows; i++) {
      if (left[i]) merged.push(left[i]);
      if (right[i]) merged.push(right[i]);
    }
    groups = merged;
  }

  grid.innerHTML = groups.map(g => tileFor(g, s.revealResults, s.mode)).join("");
}

function updateTimer(){
  if (!lastState || lastState.mode !== "timer") return;
  const endAt = lastState.countdownEndAt;
  const serverNow = lastState.serverNow;
  if (!endAt || !serverNow) return;
  // estimate client now relative to server
  const drift = Date.now() - lastState.clientReceivedAt;
  const now = serverNow + drift;
  const remaining = endAt - now;
  timerEl.textContent = fmtTime(remaining);
}

socket.on("state", (s) => {
  s.clientReceivedAt = Date.now();
  lastState = s;

  // compute ranks if in rank mode
  if (s.mode === "rank") {
    const submitted = Object.values(s.groups)
      .filter(g => g.submitted && Number.isFinite(g.submittedAt))
      .sort((a,b)=>a.submittedAt-b.submittedAt);
    const rankMap = new Map();
    submitted.forEach((g, i)=>rankMap.set(g.groupNumber, i+1));
    for (const g of Object.values(s.groups)) {
      g.rank = rankMap.get(g.groupNumber);
    }
  }

  render(s);
});

// timer loop (lightweight)
setInterval(updateTimer, 250);
