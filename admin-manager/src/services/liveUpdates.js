import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "../utils/constants";

let client = null;
let isConnected = false;

const handlersByTopic = new Map();
const stompSubscriptions = new Map();

function getWsEndpoint() {
  const token = localStorage.getItem("token");
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE_URL}/ws${query}`;
}

function ensureClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(getWsEndpoint()),
    reconnectDelay: 5000,
    onConnect: () => {
      isConnected = true;
      resubscribeAll();
    },
    onWebSocketClose: () => {
      isConnected = false;
    },
    onStompError: () => {
      isConnected = false;
    },
  });

  client.activate();
  return client;
}

function resubscribeAll() {
  handlersByTopic.forEach((_, topic) => {
    subscribeTopicOnClient(topic);
  });
}

function subscribeTopicOnClient(topic) {
  if (!client || !isConnected) return;
  if (stompSubscriptions.has(topic)) return;

  const subscription = client.subscribe(topic, (frame) => {
    const raw = frame?.body;
    let payload = null;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = raw;
    }

    const topicHandlers = handlersByTopic.get(topic);
    if (!topicHandlers || topicHandlers.size === 0) return;

    topicHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch {
        // no-op to isolate handler failures
      }
    });
  });

  stompSubscriptions.set(topic, subscription);
}

function unsubscribeTopicOnClient(topic) {
  const subscription = stompSubscriptions.get(topic);
  if (!subscription) return;

  try {
    subscription.unsubscribe();
  } catch {
    // no-op
  }

  stompSubscriptions.delete(topic);
}

function maybeShutdownClient() {
  if (handlersByTopic.size > 0) return;
  if (!client) return;

  try {
    client.deactivate();
  } catch {
    // no-op
  }

  client = null;
  isConnected = false;
  stompSubscriptions.clear();
}

export function subscribeLiveTopic(topic, handler) {
  if (!topic || typeof handler !== "function") {
    return () => {};
  }

  const topicHandlers = handlersByTopic.get(topic) || new Set();
  topicHandlers.add(handler);
  handlersByTopic.set(topic, topicHandlers);

  ensureClient();
  subscribeTopicOnClient(topic);

  return () => {
    const existing = handlersByTopic.get(topic);
    if (!existing) return;

    existing.delete(handler);

    if (existing.size === 0) {
      handlersByTopic.delete(topic);
      unsubscribeTopicOnClient(topic);
    } else {
      handlersByTopic.set(topic, existing);
    }

    maybeShutdownClient();
  };
}
