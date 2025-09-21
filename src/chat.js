// chat.js

document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("chat-button");

  if (!chatBtn) {
    console.error("Chat button not found!");
    return;
  }

  // Agar chat window already exist kare to use reuse karo
  let chatWindow = document.getElementById("chat-window");

  if (!chatWindow) {
    chatWindow = document.createElement("div");
    chatWindow.id = "chat-window";
    chatWindow.style.position = "fixed";
    chatWindow.style.bottom = "70px";
    chatWindow.style.right = "20px";
    chatWindow.style.width = "300px";
    chatWindow.style.height = "400px";
    chatWindow.style.background = "#fff";
    chatWindow.style.border = "1px solid #ccc";
    chatWindow.style.borderRadius = "10px";
    chatWindow.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    chatWindow.style.display = "none";
    chatWindow.style.flexDirection = "column";
    chatWindow.style.overflow = "hidden";
    document.body.appendChild(chatWindow);

    // Chat header
    const header = document.createElement("div");
    header.innerText = "Support Chat";
    header.style.background = "linear-gradient(to right, #667eea, #764ba2)";
    header.style.color = "#fff";
    header.style.padding = "10px";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    chatWindow.appendChild(header);

    // Messages container
    const messages = document.createElement("div");
    messages.id = "chat-messages";
    messages.style.flex = "1";
    messages.style.padding = "10px";
    messages.style.overflowY = "auto";
    chatWindow.appendChild(messages);

    // Input box
    const inputBox = document.createElement("div");
    inputBox.style.display = "flex";
    inputBox.style.borderTop = "1px solid #ccc";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    input.style.flex = "1";
    input.style.border = "none";
    input.style.padding = "10px";
    const sendBtn = document.createElement("button");
    sendBtn.innerText = "Send";
    sendBtn.style.border = "none";
    sendBtn.style.padding = "10px";
    sendBtn.style.background = "#667eea";
    sendBtn.style.color = "#fff";
    inputBox.appendChild(input);
    inputBox.appendChild(sendBtn);
    chatWindow.appendChild(inputBox);

    // Send message event
    sendBtn.addEventListener("click", () => {
      if (input.value.trim() !== "") {
        const msg = document.createElement("div");
        msg.innerText = input.value;
        msg.style.margin = "5px 0";
        msg.style.textAlign = "right";
        msg.style.color = "#333";
        messages.appendChild(msg);
        input.value = "";
        messages.scrollTop = messages.scrollHeight;
      }
    });
  }

  // Toggle chat window
  chatBtn.addEventListener("click", () => {
    if (chatWindow.style.display === "none") {
      chatWindow.style.display = "flex";
    } else {
      chatWindow.style.display = "none";
    }
  });
});
