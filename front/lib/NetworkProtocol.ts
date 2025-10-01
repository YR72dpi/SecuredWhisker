export const API_PROTOCOL: 'http' | 'https' = process.env.NODE_ENV === "development" ? "http" : "https";
export const WS_PROTOCOL: 'ws' | 'wss' = process.env.NODE_ENV === "development" ? "ws" : "wss";