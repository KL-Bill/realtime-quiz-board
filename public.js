const socket=io(window.APP_CONFIG.BACKEND_URL);
socket.on("state",(s)=>{out.textContent=JSON.stringify(s,null,2);});
