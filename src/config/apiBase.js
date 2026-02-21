const envUrl = import.meta.env.VITE_API_BASE_URL;

let API_BASE_URL;

if (envUrl) {
  API_BASE_URL = envUrl;
} else if (import.meta.env.DEV) {
  API_BASE_URL = "http://localhost:8081";
} else {
  throw new Error(
    "VITE_API_BASE_URL is not set. Please configure it for production."
  );
}

export { API_BASE_URL };
