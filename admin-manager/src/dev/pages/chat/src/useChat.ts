import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectSession,
  getSession,
  getMessages,
  getProjectMessages,
  getProjectSessions,
  startSession,
  createProjectSession,
  endChatAI,
  saveSummary,
  sendMessage,
  createProjectTicket,
} from "./api";

/**
 * Query key factory for chat-related queries
 */
export const chatKeys = {
  all: ["chat"] as const,
  projectSessions: (projectId: string) => [...chatKeys.all, "projectSessions", projectId] as const,
  session: (sessionId: string) => [...chatKeys.all, "session", sessionId] as const,
  messages: (sessionId: string) => [...chatKeys.all, "messages", sessionId] as const,
  projectMessages: (projectId: string) => [...chatKeys.all, "projectMessages", projectId] as const,
};

/**
 * Fetch all chat sessions for a project
 * Auto-refetch every 30s, staleTime=0 (always refetch in background)
 */
export function useProjectSessions(projectId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.projectSessions(projectId || ""),
    queryFn: () => getProjectSessions(projectId!),
    enabled: enabled && !!projectId,
    refetchInterval: 30000, // 30 seconds
    staleTime: 0, // Always stale, refetch in background
  });
}

/**
 * Fetch a single chat session
 * Stale after 5 minutes, cached queries deduplicated
 */
export function useChatSession(sessionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.session(sessionId || ""),
    queryFn: () => getSession(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all messages for a session
 * Stale after 30 seconds, refetch when stale
 */
export function useMessages(sessionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId || ""),
    queryFn: () => getMessages(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch all messages for a project
 * Stale after 30 seconds
 */
export function useProjectMessages(projectId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.projectMessages(projectId || ""),
    queryFn: () => getProjectMessages(projectId!),
    enabled: enabled && !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Start a new chat session for a project
 */
export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => startSession(projectId),
    onSuccess: (data, projectId) => {
      // Invalidate project sessions to refetch
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(projectId),
      });
    },
  });
}

/**
 * Create a new project session with pre-configured settings
 */
export function useCreateProjectSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => createProjectSession(projectId),
    onSuccess: (data, projectId) => {
      // Invalidate project sessions to refetch
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(projectId),
      });
    },
  });
}

/**
 * Send a message to a chat session
 * Automatically invalidates message list after success
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      sendMessage(sessionId, content),
    onSuccess: (data, variables) => {
      // Invalidate messages for this session to refetch
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.sessionId),
      });
    },
  });
}

/**
 * End a chat session with AI summary
 * Invalidates session and project sessions after success
 */
export function useEndChatAI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messages,
      projectId,
      createTickets,
    }: {
      messages: any[];
      projectId: string;
      createTickets?: boolean;
    }) => endChatAI(messages, projectId, createTickets),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(variables.projectId),
      });
    },
  });
}

/**
 * Save a summary to a chat session
 * Automatically invalidates session after success
 */
export function useSaveSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, summary }: { sessionId: string; summary: string }) =>
      saveSummary(sessionId, summary),
    onSuccess: (data, variables) => {
      // Invalidate this session's data to refetch
      queryClient.invalidateQueries({
        queryKey: chatKeys.session(variables.sessionId),
      });
    },
  });
}

/**
 * Create a ticket from a chat blocker
 */
export function useCreateProjectTicket() {
  return useMutation({
    mutationFn: ({
      projectId,
      blocker,
    }: {
      projectId: string;
      blocker: string;
    }) => createProjectTicket(projectId, blocker),
  });
}
