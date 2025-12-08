export interface Message {
  user: string;
  message: string;
  type?: "normal" | "summary" | "blocker";
}

export interface ChatEndResponse {
  summary: string;
  blockers: string[];
  tickets_created: { ticket_id: string; blocker: string }[];
  ticket_message: string;
  ticket_prompt_needed: boolean;
}
