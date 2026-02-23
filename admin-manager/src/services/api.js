import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/api", // your Spring Boot API
});

// ✅ Auth endpoints
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const me = () => API.get("/auth/me");

// Tickets (you already have these)
const TICKET_URL = "/tickets";
export const getTickets = () => API.get(TICKET_URL);
export const createTicket = (ticket) => API.post(TICKET_URL, ticket);
export const updateTicket = (id, ticket) => API.put(`${TICKET_URL}/${id}`, ticket);
export const deleteTicket = (id) => API.delete(`${TICKET_URL}/${id}`);

export default API;
