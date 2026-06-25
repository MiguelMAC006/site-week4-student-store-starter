// Base URL for the student-store-api backend.
// In production set VITE_API_BASE_URL (e.g. the deployed Render backend URL) —
// Vite inlines it at build time. Falls back to localhost:3000 for local dev.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
