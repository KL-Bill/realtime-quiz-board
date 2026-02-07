const socket=io(window.APP_CONFIG.BACKEND_URL);
document.getElementById("joinBtn").onclick=()=>{
 socket.emit("registerGroup",{groupNumber:Number(groupNum.value)});
};
document.getElementById("submitBtn").onclick=()=>{
 socket.emit("submitAnswer",{answer:answer.value});
};
