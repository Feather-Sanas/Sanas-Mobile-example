// Thin client for the Sanas backend (same endpoints the web app uses).
import {BACKEND_URL} from './config';

export type Model = {name: string; label: string; category?: string; sample_rate?: number};

/** Mint a short-lived Twilio Voice access token (the backend signs it; no creds in the app). */
export async function getToken(): Promise<string> {
  const r = await fetch(`${BACKEND_URL}/api/twilio/token`);
  const d = await r.json();
  if (!d.ok || !d.token) {
    throw new Error(d.detail || 'Voice token unavailable (is the backend configured?)');
  }
  return d.token as string;
}

/** Available Sanas models for the in-call picker. */
export async function getModels(): Promise<Model[]> {
  try {
    const d = await fetch(`${BACKEND_URL}/api/models`).then(r => r.json());
    return (d.models || []) as Model[];
  } catch {
    return [];
  }
}

/** Mid-call control: flip Sanas on/off and/or switch the active model live. */
export async function toggle(body: {
  call_sid?: string;
  bridge_id?: string;
  enabled?: boolean;
  model?: string;
}): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/twilio/toggle`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
  } catch {
    /* best-effort; the call continues even if a toggle request fails */
  }
}
