function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export const getTaskSourceValue = (task) =>
  normalizeText(
    task?.source ??
      task?.taskSource ??
      task?.origin ??
      task?.createdFrom ??
      task?.type ??
      task?.taskType ??
      task?.category ??
      task?.ticketSource ??
      task?.requestSource ??
      task?.ticket?.source ??
      task?.ticket?.origin ??
      task?.ticket?.type ??
      task?.ticket?.sourceChannel ??
      task?.description ??
      ""
  );

    export const getTicketTaskCategory = (task) => {
      const source = getTaskSourceValue(task);

      if (source.includes("email")) return "email";
      if (source.includes("chat")) return "chat";
      if (source.includes("client") || source.includes("portal")) return "client-portal";
      if (source.includes("manager")) return "manager";

      return "ticket";
    };

export const isTicketTask = (task) => {
  const source = getTaskSourceValue(task);

  return Boolean(
    task?.ticketId ||
      task?.ticket_id ||
      task?.ticket?.id ||
      task?.ticketTaskId ||
      task?.convertedFromTicket ||
      task?.fromTicket ||
      task?.isTicketTask ||
      source.includes("ticket") ||
      source.includes("email") ||
      source.includes("client") ||
      source.includes("chat") ||
      source.includes("manager")
  );
};

export const isProjectTask = (task) => !isTicketTask(task);

export const getTaskSourceLabel = (task) => {
  if (!isTicketTask(task)) return "Project Task";

  const category = getTicketTaskCategory(task);

  if (category === "email") return "Email Ticket";
  if (category === "client-portal") return "Client Portal Ticket";
  if (category === "chat") return "Chat Ticket";
  if (category === "manager") return "Manager Ticket";

  return "Ticket Task";
};

export const getTicketTaskCategoryLabel = (task) => {
  const category = getTicketTaskCategory(task);

  if (category === "email") return "Email";
  if (category === "client-portal") return "Client Portal";
  if (category === "chat") return "Chat";
  if (category === "manager") return "Manager";

  return "Ticket";
};