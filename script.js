const chatWindow = document.getElementById("chatWindow");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let taskId = "TASK1";
let chatStarted = false;

function addMessage(text, sender, type = "normal", collapsible = false, title = "") {
    const div = document.createElement("div");
    div.classList.add("message", sender);
    if (type !== "normal") div.classList.add(type);

    if (collapsible) {
        const header = document.createElement("div");
        header.classList.add("collapsible-header");
        header.textContent = title;
        header.style.cursor = "pointer";

        const content = document.createElement("div");
        content.classList.add("collapsible-content");
        content.style.display = "none";
        content.textContent = text;

        header.onclick = () => {
            content.style.display = content.style.display === "none" ? "block" : "none";
        };

        div.appendChild(header);
        div.appendChild(content);
    } else {
        div.textContent = text;
    }

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function collectMessages() {
    const msgs = [];
    document.querySelectorAll("#chatWindow .message").forEach(div => {
        const sender = div.classList.contains("user") ? "User" : "NEXORA";
        let messageText = div.textContent;
        if (div.querySelector(".collapsible-content")) {
            messageText = div.querySelector(".collapsible-content").textContent;
        }
        msgs.push({ user: sender, message: messageText });
    });
    return msgs;
}

startBtn.onclick = async () => {
    const res = await fetch("/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
    });
    if (res.ok) {
        chatStarted = true;
        addMessage("Chat started!", "ai");
    }
};

sendBtn.onclick = async () => {
    if (!chatStarted) return alert("Start chat first!");
    const msg = messageInput.value.trim();
    if (!msg) return;
    addMessage(msg, "user");
    messageInput.value = "";

    const response = await fetch("/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, user: "User", message: msg }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiDiv = document.createElement("div");
    aiDiv.classList.add("message", "ai");
    chatWindow.appendChild(aiDiv);

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiDiv.textContent += decoder.decode(value);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
};


endBtn.onclick = async () => {
    if (!chatStarted) return alert("Start chat first!");

    const messages = collectMessages();

    const res = await fetch("/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, create_tickets: false, messages }),
    });

    if (!res.ok) return alert("Error ending chat");

    const data = await res.json();

    addMessage("Summary:\n" + data.summary, "ai", "summary");

    if (data.blockers.length > 0) {
        addMessage("Blockers Detected:\n" + data.blockers.join("\n"), "ai", "blocker");

        if (data.ticket_prompt_needed) {
            const createTickets = confirm(data.ticket_message);
            
            if (createTickets) {
                const ticketRes = await fetch("/chat/end", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ task_id: taskId, create_tickets: true, messages }),
                });

                if (!ticketRes.ok) return alert("Error creating tickets");

                const ticketData = await ticketRes.json();

                if (ticketData.tickets_created.length > 0) {
                    let ticketsText = ticketData.tickets_created
                        .map(t => `${t.ticket_id}: ${t.blocker}`)
                        .join("\n");
                    addMessage("Tickets Created:\n" + ticketsText, "ai", "blocker");
                } else {
                    addMessage("No tickets were created.", "ai", "blocker");
                }
            }
        }
    } else {
        addMessage("No blockers detected.", "ai", "summary");
    }

    chatStarted = false;
};
