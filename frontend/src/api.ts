import axios from "axios";

export const API_URL = "http://127.0.0.1:8000";

export async function sendMessage(message: string, onChunk: (chunk: string) => void) {
    const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        onChunk(chunk);
    }
}

export async function endChat(messages: any[], createTickets = false) {
    const res = await axios.post(`${API_URL}/chat/end`, {
        task_id: "TASK001",
        messages,
        create_tickets: createTickets
    });
    return res.data;
}
