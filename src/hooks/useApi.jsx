import React from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export default function useApi() {
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 12000
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return api;
}
