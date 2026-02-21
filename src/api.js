import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/tickets`;

export const getTickets = () => axios.get(API_URL);
export const createTicket = (ticket) => axios.post(API_URL, ticket);
export const updateTicket = (id, ticket) => axios.put(`${API_URL}/${id}`, ticket);
export const deleteTicket = (id) => axios.delete(`${API_URL}/${id}`);
