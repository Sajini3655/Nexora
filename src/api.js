import axios from "axios";
import { API_BASE_URL } from "./config/apiBase.js";

const API_URL = `${API_BASE_URL}/tickets`;

export const getTickets = () => axios.get(API_URL);
export const createTicket = (ticket) => axios.post(API_URL, ticket);
export const updateTicket = (id, ticket) => axios.put(`${API_URL}/${id}`, ticket);
export const deleteTicket = (id) => axios.delete(`${API_URL}/${id}`);
