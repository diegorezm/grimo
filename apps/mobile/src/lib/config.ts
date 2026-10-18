/**
 * Origin that serves `/api/*`. In dev that's the web Vite server (it runs the API too).
 * Physical device: use your machine's LAN IP. Android emulator: http://10.0.2.2:5173.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5173";
