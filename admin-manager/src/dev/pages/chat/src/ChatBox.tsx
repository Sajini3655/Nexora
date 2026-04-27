import React, { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Button, Chip, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import {
  startSession,
  getMessages,
  endChatAI,
  saveSummary,
  createProjectTicket,
} from "./api";

interface Message {
  user: "me" | "other" | "assistant";
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
  source?: "ai" | "local";
}

interface ChatBoxProps {
  projectId: string;
  projectName?: string;
  currentUserId: string;
  currentUserName: string;
  onSummary: (data: ChatEndResult) => void;
  hideSidebar?: boolean;
}

const WS_URL = "http://localhost:8081/ws";

const BLOCKER_KEYWORDS = [
  "blocked",
  "blocker",
  "blocking",
  "cannot continue",
  "can't continue",
  "stuck",
  "urgent",
  "critical",
  "production down",
  "server down",
  "database down",
  "login broken",
  "not working",
  "crash",
  "error",
  "failed",
  "failing",
  "bug",
  "issue",
  "500",
];

function detectBlockers(messages: Message[]): string[] {
  return messages
    .filter((m) => {
      const message = String(m.message || "").toLowerCase();
      return BLOCKER_KEYWORDS.some((keyword) => message.includes(keyword.toLowerCase()));
    })
    .slice(-3)
    .map((m) => String(m.message || "").trim())
    .filter(Boolean);
}

function buildLocalSummary(messages: Message[]): string {
  if (!messages.length) return "Chat ended. No messages were available to summarize.";

  const lines = messages.slice(-8).map((m) => {
    const sender = m.senderName || (m.user === "user" ? "Developer" : "Assistant");
    const message = String(m.message || "").trim();
    return `- ${sender}: ${message}`;
  });

  const blockers = detectBlockers(messages);

  return [
    "Chat Summary:",
    ...lines,
    "",
    blockers.length > 0
      ? "Blocker/Risk Detected: The chat contains blocker or issue related messages."
      : "No major blocker detected from keywords.",
  ].join("\n");
}

function normalizeAiResult(data: any, messages: Message[]): ChatEndResult {
  const fallbackSummary = buildLocalSummary(messages);
  const fallbackBlockers = detectBlockers(messages);

  const summary =
    typeof data?.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : fallbackSummary;

  const aiBlockers = Array.isArray(data?.blockers)
    ? data.blockers
        .filter((item: any) => typeof item === "string" && item.trim())
        .map((item: string) => item.trim())
    : [];

  // Prefer AI-detected blockers, but if AI returns none and local keyword
  // detection finds blockers, use those so developer messages trigger tickets.
  const blockers = aiBlockers.length > 0 ? aiBlockers : fallbackBlockers;

  return {
    summary,
    blockers,
    tickets_created: Array.isArray(data?.tickets_created) ? data.tickets_created : [],
    ticket_message:
      typeof data?.ticket_message === "string"
        ? data?.ticket_message
        : "Summary generated. You can create a ticket if needed.",
    ticket_prompt_needed: (blockers && blockers.length > 0) || false,
    source: Array.isArray(data?.blockers) || (typeof data?.summary === "string" && data.summary.trim()) ? "ai" : "local",
  };
}

function ticketReasonFromSummary(summary: string, blockers: string[]): string {
  if (blockers.length > 0) return blockers[0];

  const cleanSummary = String(summary || "").trim();
  if (!cleanSummary) return "Ticket requested from ended developer chat.";

  return cleanSummary.length > 180 ? cleanSummary.substring(0, 180) + "..." : cleanSummary;
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ChatBox: React.FC<ChatBoxProps> = ({
  projectId,
  projectName = "Project chat",
  currentUserId,
  currentUserName,
  onSummary,
  hideSidebar = false,
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

  const wsUrlWithToken = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;
  }, []);

  const appendLocalUserMessage = (text: string) => {
    const createdAt = new Date().toISOString();

    setChat((prev) => [
      ...prev,
      {
        user: "me",
        message: text,
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt,
      },
    ]);

    return createdAt;
  };

  const appendAssistantMessage = (text: string) => {
    setChat((prev) => [
      ...prev,
      {
        user: "assistant",
        message: text,
        senderName: "AI Shadow",
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const isRecentDuplicate = (existing: Message, incoming: Message) => {
    if (existing.senderId !== incoming.senderId) return false;
    if (existing.message !== incoming.message) return false;

    const existingTime = existing.createdAt ? new Date(existing.createdAt).getTime() : NaN;
    const incomingTime = incoming.createdAt ? new Date(incoming.createdAt).getTime() : NaN;

    if (Number.isNaN(existingTime) || Number.isNaN(incomingTime)) return true;

    return Math.abs(incomingTime - existingTime) < 8000;
  };

  useEffect(() => {
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, showTicketPrompt, errorMessage, summaryData]);

  useEffect(() => {
    let cancelled = false;

    const initializeChat = async () => {
      try {
        if (!projectId || !currentUserId) {
          throw new Error("Missing project or user context for chat session.");
        }

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
          ? storedMessages.map((m: any) => {
              const senderName = m.senderName ?? "Unknown";
              const isAi = String(senderName).toLowerCase().includes("ai") || senderName === "AI Shadow";
              const isMe = String(m.senderId) === String(currentUserId);

              return {
                user: isAi ? "assistant" : isMe ? "me" : "other",
                message: m.content ?? "",
                senderId: String(m.senderId),
                senderName: senderName,
                createdAt: m.createdAt,
              };
            })
          : [];

        setChat(mappedMessages);

        if (session.ended) {
          setChatEnded(true);

          if (session.summary) {
            const endedSummary: ChatEndResult = {
              summary: session.summary,
              blockers: detectBlockers(mappedMessages),
              tickets_created: [],
              ticket_message: "",
              ticket_prompt_needed: false,
              source: "ai",
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
        if (!cancelled) setLoadingSession(false);
      }
    };

    initializeChat();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentUserId, onSummary]);

  useEffect(() => {
    if (!subscriptionTopic || !sessionId || chatEnded) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrlWithToken),
      reconnectDelay: 5000,
      onConnect: () => {
        setSocketConnected(true);
        setErrorMessage("");

        client.subscribe(subscriptionTopic, (message) => {
          const payload = JSON.parse(message.body);

          const incomingSenderName = payload.senderName ?? "Unknown";
          const incomingIsAi = String(incomingSenderName).toLowerCase().includes("ai") || incomingSenderName === "AI Shadow";
          const incomingIsMe = String(payload.senderId) === String(currentUserId);

          const incoming: Message = {
            user: incomingIsAi ? "assistant" : incomingIsMe ? "me" : "other",
            message: payload.content ?? "",
            senderId: String(payload.senderId),
            senderName: incomingSenderName,
            createdAt: payload.createdAt,
          };

          setChat((prev) => {
            const exists = prev.some((m) => isRecentDuplicate(m, incoming));
            return exists ? prev : [...prev, incoming];
          });
        });
      },
      onStompError: () => {
        setErrorMessage("WebSocket error occurred.");
        setSocketConnected(false);
      },
      onWebSocketClose: () => {
        setSocketConnected(false);
      },
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
  }, [subscriptionTopic, sessionId, currentUserId, chatEnded, wsUrlWithToken]);

  const buildAiMessages = (messages: Message[]) => {
    return messages.map((m) => ({
      user: m.user,
      message: m.message,
      type: "normal" as const,
    }));
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

    const messageText = input.trim();
    let localCreatedAt = "";

    try {
      setErrorMessage("");

      localCreatedAt = appendLocalUserMessage(messageText);

      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          sessionId: Number(sessionId),
          userId: Number(currentUserId),
          content: messageText,
        }),
      });

      setInput("");
    } catch (error: any) {
      setChat((prev) =>
        prev.filter(
          (m) =>
            !(
              m.user === "user" &&
              m.senderId === currentUserId &&
              m.message === messageText &&
              m.createdAt === localCreatedAt
            )
        )
      );

      setErrorMessage(error?.message || "Failed to send message.");
    }
  };

  const handleEndChat = async () => {
    if (!sessionId || chat.length === 0 || endingChat || chatEnded) return;

    try {
      setEndingChat(true);
      setErrorMessage("");

      let result: ChatEndResult;

      try {
        const aiData = await endChatAI(buildAiMessages(chat), projectId, false);
        result = normalizeAiResult(aiData, chat);
      } catch {
        result = normalizeAiResult(null, chat);
      }

      await saveSummary(sessionId, result.summary);

      const blockers = Array.isArray(result.blockers) ? result.blockers : [];
      const finalResult: ChatEndResult = {
        ...result,
        ticket_prompt_needed: blockers.length > 0,
      };

      setSummaryData(finalResult);
      setChatEnded(true);
      setShowTicketPrompt(blockers.length > 0);
      onSummary(finalResult);
    } catch (error: any) {
      const fallbackResult: ChatEndResult = {
        summary: buildLocalSummary(chat),
        blockers: detectBlockers(chat),
        tickets_created: [],
        ticket_message: "Summary generated locally. You can create a ticket if needed.",
        ticket_prompt_needed: detectBlockers(chat).length > 0,
        source: "local",
      };

      setSummaryData(fallbackResult);
      setChatEnded(true);
      setShowTicketPrompt(fallbackResult.blockers.length > 0);
      onSummary(fallbackResult);

      setErrorMessage(error?.message || "Chat ended with fallback summary, but backend save may have failed.");
    } finally {
      setEndingChat(false);
    }
  };

  const handleTicketChoice = async (createTickets: boolean) => {
    if (!summaryData) return;

    try {
      setShowTicketPrompt(false);
      setErrorMessage("");

      if (!createTickets) {
        const skippedResult: ChatEndResult = {
          ...summaryData,
          ticket_message: "Ticket creation skipped by user.",
          ticket_prompt_needed: false,
        };

        setSummaryData(skippedResult);
        onSummary(skippedResult);
        return;
      }

      const blockerOrReason = ticketReasonFromSummary(summaryData.summary, summaryData.blockers);
      const created = await createProjectTicket(projectId, blockerOrReason);

      const createdTicket = {
        ticket_id: String(created?.id ?? "UNKNOWN"),
        blocker: blockerOrReason,
      };

      const finalResult: ChatEndResult = {
        ...summaryData,
        blockers: summaryData.blockers.length > 0 ? summaryData.blockers : [blockerOrReason],
        tickets_created: [createdTicket],
        ticket_message: "Created 1 ticket from the chat summary.",
        ticket_prompt_needed: false,
      };

      setSummaryData(finalResult);
      onSummary(finalResult);
    } catch (error: any) {
      appendAssistantMessage("Error while creating ticket.");
      setErrorMessage(error?.message || "Failed to create ticket.");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const styles: { [key: string]: CSSProperties } = {
    shell: {
      minHeight: 360,
      display: "grid",
      gridTemplateColumns: hideSidebar ? "minmax(0, 1fr)" : "270px minmax(0, 1fr)",
      borderRadius: 22,
      overflow: "hidden",
      background: "linear-gradient(180deg, #0f1b2f 0%, #0b1628 100%)",
      border: "1px solid rgba(148,163,184,0.14)",
      boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
    },
    sidebar: {
      padding: 18,
      background: "#0a1222",
      borderRight: "1px solid rgba(148,163,184,0.12)",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },
    roomCard: {
      padding: 14,
      borderRadius: 16,
      background: "#111d33",
      border: "1px solid rgba(148,163,184,0.14)",
    },
    memberCard: {
      padding: "10px 12px",
      borderRadius: 14,
      background: "#0f1b2f",
      border: "1px solid rgba(148,163,184,0.10)",
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    main: {
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      background: "#0b1628",
    },
    header: {
      minHeight: 74,
      padding: "16px 18px",
      borderBottom: "1px solid rgba(148,163,184,0.12)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      background: "#0d182b",
    },
    window: {
      flex: 1,
      minHeight: 430,
      maxHeight: 520,
      padding: 18,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      background:
        "radial-gradient(800px 300px at 15% 0%, rgba(109,93,252,0.08), transparent 55%), #081323",
    },
    inputBar: {
      padding: 12,
      borderTop: "1px solid rgba(148,163,184,0.12)",
      background: "#0d182b",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto auto",
      gap: 8,
      alignItems: "center",
      position: "sticky",
      bottom: 0,
      zIndex: 3,
    },
    input: {
      width: "100%",
      minWidth: 0,
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(148,163,184,0.22)",
      background: "#101b2f",
      color: "#f8fafc",
      outline: "none",
      fontSize: 14,
    },
    emptyState: {
      margin: "auto",
      maxWidth: 460,
      textAlign: "center",
      color: "#94a3b8",
      padding: 24,
      borderRadius: 18,
      border: "1px dashed rgba(148,163,184,0.22)",
      background: "rgba(255,255,255,0.025)",
    },
    bubbleWrapUser: {
      alignSelf: "flex-end",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      maxWidth: "72%",
    },
    bubbleWrapAssistant: {
      alignSelf: "flex-start",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      maxWidth: "72%",
    },
    bubbleUser: {
      background: "linear-gradient(135deg, #6d5dfc, #4f46e5)",
      color: "#fff",
      padding: "11px 14px",
      borderRadius: "16px 16px 4px 16px",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      boxShadow: "0 12px 26px rgba(109,93,252,0.24)",
      fontSize: 14,
      lineHeight: 1.5,
    },
    bubbleAI: {
      background: "#111d33",
      color: "#e2e8f0",
      padding: "11px 14px",
      borderRadius: "16px 16px 16px 4px",
      border: "1px solid rgba(148,163,184,0.12)",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      fontSize: 14,
      lineHeight: 1.5,
    },
    bubbleOther: {
      background: "linear-gradient(135deg, #2b6cb0, #1e40af)",
      color: "#fff",
      padding: "11px 14px",
      borderRadius: "16px 16px 4px 16px",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      fontSize: 14,
      lineHeight: 1.5,
      boxShadow: "0 8px 18px rgba(30,64,175,0.12)",
    },
    meta: {
      fontSize: 11,
      color: "#64748b",
      marginBottom: 5,
      display: "flex",
      gap: 8,
    },
    ticketPrompt: {
      marginTop: 8,
      padding: 14,
      borderRadius: 16,
      background: "rgba(109,93,252,0.13)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      border: "1px solid rgba(109,93,252,0.28)",
    },
    summaryBox: {
      marginTop: 12,
      padding: 14,
      borderRadius: 12,
      background: "rgba(17,29,51,0.6)",
      border: "1px solid rgba(148,163,184,0.06)",
      color: "#e6eef8",
      fontSize: 14,
      whiteSpace: "pre-wrap",
    },
    errorBox: {
      padding: 12,
      borderRadius: 14,
      background: "rgba(239,68,68,0.12)",
      color: "#fecaca",
      fontSize: 13,
      border: "1px solid rgba(239,68,68,0.24)",
    },
    smallLabel: {
      fontSize: 11,
      color: "#64748b",
      fontWeight: 800,
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },
  };

  return (
    <div style={styles.shell} className="nx-chat-shell">
      {!hideSidebar && (
        <aside style={styles.sidebar} className="nx-chat-sidebar">
          <div>
            <div style={styles.smallLabel}>Workspace</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginTop: 4 }}>
              AI Shadow Chat
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              Project discussion with live updates.
            </div>
          </div>

          <div style={styles.roomCard}>
            <div style={styles.smallLabel}>Active room</div>
            <div style={{ color: "#f8fafc", fontWeight: 900, marginTop: 6 }}>
              {projectName}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
              Project ID: {projectId}
            </div>
          </div>

          <div>
            <div style={{ ...styles.smallLabel, marginBottom: 8 }}>Members</div>
            <div style={styles.memberCard}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6d5dfc, #22c55e)",
                }}
              />
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 13 }}>
                  {currentUserName}
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Developer</div>
              </div>
            </div>
            <div style={{ ...styles.memberCard, marginTop: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#1e293b",
                  display: "grid",
                  placeItems: "center",
                  color: "#a78bfa",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                AI
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 13 }}>
                  AI Shadow
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Summary assistant</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={styles.smallLabel}>Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1", fontSize: 13, marginTop: 8 }}>
              <CircleRoundedIcon sx={{ fontSize: 10, color: socketConnected ? "#22c55e" : "#64748b" }} />
              {socketConnected ? "Live connection" : "Offline"}
            </div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>
              {chatEnded ? "Chat ended. Summary processed." : "Messages sync in real time."}
            </div>
          </div>
        </aside>
      )}

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#f8fafc" }}>
              {projectName}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 3 }}>
              {chatEnded ? "Chat ended" : "Live project discussion"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Chip
              size="small"
              label={socketConnected ? "Live" : "Offline"}
              sx={{
                bgcolor: socketConnected ? "rgba(34,197,94,0.14)" : "rgba(100,116,139,0.16)",
                color: socketConnected ? "#86efac" : "#cbd5e1",
                fontWeight: 900,
              }}
            />
            <Chip
              size="small"
              label={`${chat.length} messages`}
              sx={{
                bgcolor: "rgba(96,165,250,0.14)",
                color: "#bfdbfe",
                fontWeight: 900,
              }}
            />
            {chatEnded && (
              <Button
                size="small"
                variant="contained"
                onClick={async () => {
                  try {
                    setLoadingSession(true);
                    setErrorMessage("");
                    setChat([]);
                    setSummaryData(null);
                    setShowTicketPrompt(false);

                    const session = await startSession(projectId);
                    if (!session || !session.id) throw new Error("Failed to start new chat session");
                    setSessionId(String(session.id));

                    const stored = await getMessages(String(session.id));
                    const mapped: Message[] = Array.isArray(stored)
                      ? stored.map((m: any) => {
                          const senderName = m.senderName ?? "Unknown";
                          const isAi = String(senderName).toLowerCase().includes("ai") || senderName === "AI Shadow";
                          const isMe = String(m.senderId) === String(currentUserId);

                          return {
                            user: isAi ? "assistant" : isMe ? "me" : "other",
                            message: m.content ?? "",
                            senderId: String(m.senderId),
                            senderName: senderName,
                            createdAt: m.createdAt,
                          };
                        })
                      : [];

                    setChat(mapped);
                    setChatEnded(false);
                    setShowTicketPrompt(false);
                  } catch (e: any) {
                    setErrorMessage(e?.message || "Failed to start new chat.");
                  } finally {
                    setLoadingSession(false);
                  }
                }}
                disabled={loadingSession}
                sx={{ fontWeight: 900 }}
              >
                Start new chat
              </Button>
            )}
          </div>
        </header>

        <section style={styles.window} ref={chatWindowRef}>
          {loadingSession ? (
            <div style={styles.emptyState}>Loading chat session...</div>
          ) : (
            <>
              {chat.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={{ fontWeight: 900, color: "#f8fafc", marginBottom: 6 }}>
                    Start the project conversation
                  </div>
                  <div>
                    Share blockers, implementation notes, or project updates. End the chat to generate an AI summary and create tickets when needed.
                  </div>
                </div>
              )}

              {chat.map((m, idx) => {
                const isMe = m.user === "me";
                const isAssistant = m.user === "assistant";

                const wrapStyle = isMe ? styles.bubbleWrapUser : styles.bubbleWrapAssistant;
                const bubbleStyle = isAssistant ? styles.bubbleAI : isMe ? styles.bubbleUser : styles.bubbleOther;

                return (
                  <div key={`${m.createdAt || "msg"}-${idx}`} style={wrapStyle}>
                    <div style={styles.meta}>
                      <span>{m.senderName || (isMe ? currentUserName : isAssistant ? "AI Shadow" : "User")}</span>
                      <span>{formatTime(m.createdAt)}</span>
                    </div>
                    <div style={bubbleStyle}>{m.message}</div>
                  </div>
                );
              })}

              {showTicketPrompt && (
                <div style={styles.ticketPrompt}>
                  <div>
                    <div style={{ color: "#f8fafc", fontWeight: 900 }}>
                      Create a ticket from this summary?
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 3 }}>
                      The manager can review and assign it as a task.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      style={{ color: "#22c55e", background: "rgba(34,197,94,0.12)" }}
                      onClick={() => handleTicketChoice(true)}
                      size="small"
                    >
                      <CheckIcon />
                    </IconButton>

                    <IconButton
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.12)" }}
                      onClick={() => handleTicketChoice(false)}
                      size="small"
                    >
                      <CloseIcon />
                    </IconButton>
                  </div>
                </div>
              )}

              {summaryData && (
                <div style={styles.summaryBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 900 }}>Chat summary</div>
                    <div style={{ fontSize: 12, color: "#86efac", fontWeight: 800 }}>
                      {summaryData.source === "ai" ? "AI Summary" : "Local Summary"}
                    </div>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: 13, whiteSpace: "pre-wrap" }}>{summaryData.summary}</div>
                </div>
              )}

              {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
            </>
          )}
        </section>

        <footer style={styles.inputBar}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={chatEnded ? "Chat ended" : socketConnected ? "Type a message..." : "Waiting for live connection..."}
            disabled={chatEnded || endingChat || loadingSession || !socketConnected}
          />

          <Button
            variant="contained"
            onClick={handleSend}
            startIcon={<SendRoundedIcon />}
            disabled={!input.trim() || endingChat || chatEnded || loadingSession || !socketConnected}
            sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
          >
            Send
          </Button>

          <Button
            variant="outlined"
            onClick={handleEndChat}
            startIcon={<StopCircleRoundedIcon />}
            disabled={chat.length === 0 || endingChat || chatEnded || loadingSession}
            sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
          >
            {endingChat ? "Ending..." : "End"}
          </Button>
        </footer>
      </main>

      <style>
        {`
          @media (max-width: 1050px) {
            .nx-chat-shell {
              grid-template-columns: 1fr !important;
            }

            .nx-chat-sidebar {
              display: none !important;
            }
          }

          /* Improve placeholder visibility and ensure input stays visible when embedded */
          .nx-chat-shell input::placeholder { color: rgba(148,163,184,0.7); }
          .nx-chat-shell input { caret-color: #a78bfa; }
        `}
      </style>
    </div>
  );
};

export default ChatBox;
