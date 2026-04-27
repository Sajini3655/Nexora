import { useEffect, useRef } from "react";
import { subscribeLiveTopic } from "../services/liveUpdates";

export default function useLiveRefresh(topics, onRefresh, options = {}) {
  const { debounceMs = 350, enabled = true } = options;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const topicList = Array.isArray(topics) ? topics.filter(Boolean) : [];
    if (topicList.length === 0) return undefined;

    const scheduleRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onRefresh();
      }, debounceMs);
    };

    const unsubscribers = topicList.map((topic) => subscribeLiveTopic(topic, scheduleRefresh));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [topics, onRefresh, debounceMs, enabled]);
}

