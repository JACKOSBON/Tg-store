function toggleChat() {
  const chatBox = document.getElementById("chatBox");
  chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("messages");

  if (input.value.trim() !== "") {
    let msg = document.createElement("p");
    msg.innerHTML = "<b>You:</b> " + input.value;
    messages.appendChild(msg);

    // Auto reply (demo)
    let reply = document.createElement("p");
    reply.innerHTML = "<b>Bot:</b> Thanks for your message!";
    messages.appendChild(reply);

    messages.scrollTop = messages.scrollHeight;
    input.value = "";
  }
}
