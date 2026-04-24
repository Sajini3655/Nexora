import React, { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Button, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  startSession,
  getMessages,
  endChatAI,
  saveSummary
} from "./api";

interface Message {
  user: "user" | "assistant";
  message: string;
  senderId?: string;
  senderName?: string;
  createdAt?: string;
}

interface TicketCreated {
  ticket_id: string;
  blocker: string;
}

interface ChatEndResult {
  summary: string;
  blockers: string[];
  tickets_created: TicketCreated[];
  ticket_message: string;
  ticket_prompt_needed: boolean;
}

interface ChatBoxProps {
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  onSummary: (data: ChatEndResult) => void;
}

const WS_URL = "http://localhost:8081/ws";

const ChatBox: React.FC<ChatBoxProps> = ({
  projectId,
  currentUserId,
  currentUserName,
  onSummary
}) => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [endingChat, setEndingChat] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [summaryData, setSummaryData] = useState<ChatEndResult | null>(null);
  const [showTicketPrompt, setShowTicketPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const subscriptionTopic = useMemo(
    () => (sessionId ? `/topic/chat/${sessionId}` : null),
    [sessionId]
  );

  useEffect(() => {
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, showTicketPrompt, errorMessage]);

  useEffect(() => {
    let cancelled = false;

    const initializeChat = async () => {
      try {
        setLoadingSession(true);
        setErrorMessage("");
        setChat([]);
        setSessionId(null);
        setChatEnded(false);
        setSummaryData(null);
        setShowTicketPrompt(false);
        setSocketConnected(false);

        const session = await startSession(projectId);

        if (cancelled) return;

        if (!session || !session.id) {
          throw new Error("Chat session was not created.");
        }

        setSessionId(String(session.id));

        const storedMessages = await getMessages(String(session.id));

        if (cancelled) return;

        const mappedMessages: Message[] = Array.isArray(storedMessages)
          ? storedMessages.map((m: any) => ({
              user: String(m.senderId) === String(currentUserId) ? "user" : "assistant",
              message: m.content ?? "",
              senderId: String(m.senderId),
              senderName: m.senderName ?? "Unknown",
              createdAt: m.createdAt
            }))
          : [];

        setChat(mappedMessages);

        if (session.ended) {
          setChatEnded(true);

          if (session.summary) {
            const endedSummary: ChatEndResult = {
              summary: session.summary,
              blockers: [],
              tickets_created: [],
              ticket_message: "",
              ticket_prompt_needed: false,
            };
            setSummaryData(endedSummary);
            onSummary(endedSummary);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(error?.message || "Failed to initialize chat session.");
          setSessionId(null);
          setChat([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSession(false);
        }
      }
    };

    initializeChat();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentUserId, onSummary]);

  useEffect(() => {
    if (!subscriptionTopic || !sessionId || chatEnded) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setSocketConnected(true);
        setErrorMessage("");

        client.subscribe(subscriptionTopic, (message) => {
          const payload = JSON.parse(message.body);

          const incoming: Message = {
            user:
              String(payload.senderId) === String(currentUserId)
                ? "user"
                : "assistant",
            message: payload.content ?? "",
            senderId: String(payload.senderId),
            senderName: payload.senderName ?? "Unknown",
            createdAt: payload.createdAt
          };

          setChat((prev) => {
            const exists = prev.some(
              (m) =>
                m.message === incoming.message &&
                m.senderId === incoming.senderId &&
                m.createdAt === incoming.createdAt
            );

            if (exists) return prev;
            return [...prev, incoming];
          });
        });
      },
      onStompError: () => {
        setErrorMessage("WebSocket error occurred.");
      },
      onWebSocketClose: () => {
        setSocketConnected(false);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      setSocketConnected(false);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [subscriptionTopic, sessionId, currentUserId, chatEnded]);

  const buildAiMessages = (messages: Message[]) => {
    return messages.map((m) => ({
      user: m.user,
      message: m.message,
      type: "normal" as const,
    }));
  };

  const appendAssistantMessage = (text: string) => {
    setChat((prev) => [
      ...prev,
      {
        user: "assistant",
        message: text,
        senderName: "AI Shadow"
      }
    ]);
  };

  const handleSend = async () => {
    if (
      !input.trim() ||
      endingChat ||
      chatEnded ||
      loadingSession ||
      !sessionId ||
      !stompClientRef.current ||
      !socketConnected
    ) {
      return;
    }

    try {
      setErrorMessage("");

      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          sessionId: Number(sessionId),
          userId: Number(currentUserId),
          content: input.trim()
        })
      });

      setInput("");
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to send message.");
    }
  };

  const handleEndChat = async () => {
    if (!sessionId || chat.length === 0 || endingChat || chatEnded) {
      return;
    }

    try {
      setEndingChat(true);
      setErrorMessage("");

      const result = await endChatAI(buildAiMessages(chat), projectId, false);

      setSummaryData(result);
      setChatEnded(true);

      await saveSummary(sessionId, result.summary);

      if (result.blockers?.length > 0 && result.ticket_prompt_needed) {
        setShowTicketPrompt(true);
      } else {
        if (result.ticket_message) {
          appendAssistantMessage(`ℹ️ ${result.ticket_message}`);
        }
        onSummary(result);
      }
    } catch (error: any) {
      appendAssistantMessage("[Error generating summary]");
      setErrorMessage(error?.message || "Failed to end chat and generate summary.");
    } finally {
      setEndingChat(false);
    }
  };

  const handleTicketChoice = async (createTickets: boolean) => {
    if (!summaryData || !sessionId) {
      return;
    }

    try {
      setShowTicketPrompt(false);
      setErrorMessage("");

      if (createTickets) {
        const finalResult = await endChatAI(buildAiMessages(chat), projectId, true);
        setSummaryData(finalResult);

        await saveSummary(sessionId, finalResult.summary);

        if (finalResult.tickets_created?.length > 0) {
          finalResult.tickets_created.forEach((ticket) => {
            appendAssistantMessage(
              `✅ Ticket created: ${ticket.ticket_id} for blocker "${ticket.blocker}"`
            );
          });
        } else if (finalResult.ticket_message) {
          appendAssistantMessage(`ℹ️ ${finalResult.ticket_message}`);
        }

        onSummary(finalResult);
      } else {
        appendAssistantMessage("ℹ️ Ticket creation skipped by user.");
        onSummary(summaryData);
      }
    } catch (error: any) {
      appendAssistantMessage("[Error while processing ticket choice]");
      setErrorMessage(error?.message || "Failed to process ticket creation choice.");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const styles: { [key: string]: CSSProperties } = {
    container: {
      width: "100%",
      minHeight: 620,
      display: "flex",
      flexDirection: "column",
      borderRadius: 24,
      overflow: "hidden",
      fontFamily: "Inter, sans-serif",
      background:
        "linear-gradient(180deg, rgba(17,23,43,0.96) 0%, rgba(10,14,28,0.98) 100%)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
      position: "relative",
    },
    header: {
      padding: "16px 18px",
      textAlign: "center",
      fontWeight: 700,
      background: "rgba(255,255,255,0.10)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: 16,
    },
    window: {
      flex: 1,
      padding: "14px 16px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      background: "rgba(255,255,255,0.03)",
      position: "relative",
    },
    inputRow: {
      display: "flex",
      padding: 12,
      gap: 8,
      borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.03)",
    },
    input: {
      flex: 1,
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      outline: "none",
      fontSize: 14,
    },
    bubbleUser: {
      alignSelf: "flex-end",
      background: "linear-gradient(90deg, #7a5cff 0%, #906dff 100%)",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 16,
      maxWidth: "80%",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      boxShadow: "0 10px 24px rgba(122,92,255,0.25)",
    },
    bubbleAI: {
      alignSelf: "flex-start",
      background: "rgba(255,255,255,0.10)",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 16,
      maxWidth: "80%",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
    },
    senderLabel: {
      fontSize: 11,
      opacity: 0.7,
      marginBottom: 4
    },
    ticketPrompt: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      background: "rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      border: "1px solid rgba(255,255,255,0.08)"
    },
    ticketText: {
      color: "#fff",
      fontWeight: 500,
      fontSize: 14,
      flex: 1,
    },
    errorBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      background: "rgba(255,0,0,0.14)",
      color: "#ffd5d5",
      fontSize: 13,
    },
    footerInfo: {
      padding: "8px 14px 0 14px",
      fontSize: 12,
      opacity: 0.7,
      display: "flex",
      justifyContent: "space-between"
    },
    loadingText: {
      opacity: 0.7,
      fontSize: 14,
    },
    emptyText: {
      opacity: 0.7,
      fontSize: 14,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>AI Shadow Chat</div>

      <div style={styles.window} ref={chatWindowRef}>
        {loadingSession ? (
          <div style={styles.loadingText}>Loading chat session...</div>
        ) : (
          <>
            {chat.length === 0 && (
              <div style={styles.emptyText}>
                Team members can discuss here. Messages are live for everyone in this chat.
              </div>
            )}

            {chat.map((m, idx) => (
              <div
                key={idx}
                style={m.user === "user" ? styles.bubbleUser : styles.bubbleAI}
              >
                {m.senderName && <div style={styles.senderLabel}>{m.senderName}</div>}
                {m.message}
              </div>
            ))}

            {showTicketPrompt && (
              <div style={styles.ticketPrompt}>
                <span style={styles.ticketText}>
                  🚨 Blocker detected. Do you want to create ticket(s)?
                </span>

                <div style={{ display: "flex", gap: 6 }}>
                  <IconButton
                    style={{ color: "#22c55e" }}
                    onClick={() => handleTicketChoice(true)}
                    size="small"
                  >
                    <CheckIcon />
                  </IconButton>

                  <IconButton
                    style={{ color: "#ef4444" }}
                    onClick={() => handleTicketChoice(false)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>
            )}

            {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
          </>
        )}
      </div>

      <div style={styles.footerInfo}>
        <span>
          {chatEnded
            ? "Chat ended. Summary processed."
            : "Live project discussion"}
        </span>
        <span>{socketConnected ? "● Live" : "○ Offline"}</span>
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={chatEnded ? "Chat ended" : "Type a message..."}
          disabled={chatEnded || endingChat || loadingSession || !socketConnected}
        />

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            !input.trim() ||
            endingChat ||
            chatEnded ||
            loadingSession ||
            !socketConnected
          }
        >
          Send
        </Button>

        <Button
          color="secondary"
          variant="outlined"
          onClick={handleEndChat}
          disabled={chat.length === 0 || endingChat || chatEnded || loadingSession}
        >
          {endingChat ? "Ending..." : "End Chat"}
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;