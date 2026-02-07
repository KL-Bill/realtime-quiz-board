const entry = document.getElementById("entry");
const goBtn = document.getElementById("goBtn");
const msg = document.getElementById("msg");

// Admin code: 232323
// Public code: 123123
const ADMIN_CODE = "232323";
const PUBLIC_CODE = "123123";

function route() {
  const v = (entry.value || "").trim();

  if (!v) {
    msg.textContent = "Please enter a group number.";
    return;
  }

  if (v === ADMIN_CODE) {
    location.href = "./admin.html";
    return;
  }
  if (v === PUBLIC_CODE) {
    location.href = "./public.html";
    return;
  }

  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= (window.APP_CONFIG.MAX_GROUPS || 10)) {
    localStorage.setItem("groupNumber", String(n));
    location.href = "./group.html";
    return;
  }

  msg.textContent = "Invalid group number.";
}

goBtn.addEventListener("click", route);
entry.addEventListener("keydown", (e) => {
  if (e.key === "Enter") route();
});
