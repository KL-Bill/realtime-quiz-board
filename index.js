const entry = document.getElementById("entry");
const goBtn = document.getElementById("goBtn");
const clearBtn = document.getElementById("clearBtn");
const msg = document.getElementById("msg");

function route() {
  const v = (entry.value || "").trim();

  if (!v) {
    msg.textContent = "Please enter a code or group number.";
    return;
  }

  if (v === window.APP_CONFIG.ADMIN_CODE) {
    location.href = "./admin.html";
    return;
  }
  if (v === window.APP_CONFIG.PUBLIC_CODE) {
    location.href = "./public.html";
    return;
  }

  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= (window.APP_CONFIG.MAX_GROUPS || 10)) {
    localStorage.setItem("groupNumber", String(n));
    location.href = "./group.html";
    return;
  }

  msg.textContent = "Invalid entry. Use admin code, public code, or a group number.";
}

goBtn.addEventListener("click", route);
entry.addEventListener("keydown", (e) => {
  if (e.key === "Enter") route();
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("groupNumber");
  msg.textContent = "Saved group cleared.";
});
