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


export const chatKeys = {
  all: ["chat"] as const,
  projectSessions: (projectId: string) => [...chatKeys.all, "projectSessions", projectId] as const,
  session: (sessionId: string) => [...chatKeys.all, "session", sessionId] as const,
  messages: (sessionId: string) => [...chatKeys.all, "messages", sessionId] as const,
  projectMessages: (projectId: string) => [...chatKeys.all, "projectMessages", projectId] as const,
};


export function useProjectSessions(projectId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.projectSessions(projectId || ""),
    queryFn: () => getProjectSessions(projectId!),
    enabled: enabled && !!projectId,
    refetchInterval: 30000,
    staleTime: 0,
  });
}


export function useChatSession(sessionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.session(sessionId || ""),
    queryFn: () => getSession(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useMessages(sessionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId || ""),
    queryFn: () => getMessages(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 30 * 1000,
  });
}


export function useProjectMessages(projectId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.projectMessages(projectId || ""),
    queryFn: () => getProjectMessages(projectId!),
    enabled: enabled && !!projectId,
    staleTime: 30 * 1000,
  });
}


export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => startSession(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(projectId),
      });
    },
  });
}


export function useCreateProjectSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => createProjectSession(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(projectId),
      });
    },
  });
}


export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      sendMessage(sessionId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.sessionId),
      });
    },
  });
}


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
      queryClient.invalidateQueries({
        queryKey: chatKeys.projectSessions(variables.projectId),
      });
    },
  });
}


export function useSaveSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, summary }: { sessionId: string; summary: string }) =>
      saveSummary(sessionId, summary),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.session(variables.sessionId),
      });
    },
  });
}


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

