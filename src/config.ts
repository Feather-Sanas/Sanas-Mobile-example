// Backend = the same FastAPI server as the web app (Twilio token + models + mid-call
// toggle). Point this at your deployed URL. During development the pinned ngrok tunnel
// works from a real device or simulator. No Twilio credentials live in the app — the
// access token is minted by the backend at call time.
export const BACKEND_URL = 'https://overcast-acronym-traction.ngrok-free.dev';

// Default Sanas model on the call (8 kHz telephony noise-cancellation). The in-call
// picker can switch this live.
export const DEFAULT_MODEL = 'AGENTIC_VI_GT_NC';

// The browser/app "hear yourself through Sanas" mode — your voice is processed by the
// selected model in real time and played back, so you can A/B it live (Model on/off).
export const CALL_MODE = 'sanas';
