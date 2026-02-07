const socket=io(window.APP_CONFIG.BACKEND_URL);
authBtn.onclick=()=>socket.emit("adminAuth",{code:code.value});
resetBtn.onclick=()=>socket.emit("adminResetRound");
