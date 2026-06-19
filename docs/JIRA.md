# Jira package — Sanas Mobile: In-App Live Voice Call

Everything needed to drop this into Jira: an **Epic** + **12 child issues** with descriptions,
acceptance criteria, labels, and estimates. Two ways to load it:

- **Bulk import:** `docs/jira-import.csv` (see "How to import" at the bottom).
- **Manual:** copy each block below into a new issue.

Supporting docs: **PRD** → `docs/PRD.md` · **Interactive mockup** → `docs/mockup.html`
(hosted: https://claude.ai/code/artifact/21c102dd-8830-4c68-b08b-f3faa4e82910).

Suggested labels on every issue: `sanas-mobile`, `voice-call`. Suggested components:
`mobile`, `react-native`, `twilio`.

---

## EPIC — Sanas Mobile: In-App Live Voice Call (iOS + Android)

**Type:** Epic · **Epic name:** Sanas Mobile Voice Call

A focused React Native app for iOS + Android that places an in-app voice call where the user
hears their own voice processed by a **Sanas** model in real time, with **mid-call model
on/off and live model switching**. Mobile counterpart of the web "Call in the browser"
feature, reusing the same backend (`/api/twilio/*`).

**In scope:** the voice call, Sanas model picker, Model on/off + live switch, Call/Hang-up
with green in-call state + timer, light/dark.
**Out of scope:** chatbot/LLM, RAG/knowledge base, any data/file upload, dial-out / IVR /
"talk to a human" / in-path bridge, the audio Playground / ASR / spectrogram / ROI / booking.

**Success:** from a physical device on cellular, Call connects in a few seconds and the user
hears their processed voice; toggling/switching the model is audible without dropping the
call; shippable to TestFlight + Play internal testing.

---

## Stories & tasks

### SM-1 · Backend readiness for mobile  · Task · 2 pts · Highest
**Enabler / dependency.** Ensure the shared backend is mobile-ready.
**Description:** Sanas SDK in `real` mode; Twilio browser-voice configured
(`TWILIO_API_KEY_SID/SECRET`, `TWILIO_TWIML_APP_SID`, `PUBLIC_BASE_URL`); TwiML App Voice URL
points at `{PUBLIC_BASE_URL}/api/twilio/voice`; a **stable** public URL (pinned tunnel or
production domain) so the call path doesn't rotate.
**Acceptance criteria:**
- `GET /api/health` reports `mode: real`.
- `GET /api/twilio/config` reports `browser_voice: true`.
- `GET /api/twilio/token` returns a token; TwiML App Voice URL matches `PUBLIC_BASE_URL`.
- Backend reachable over HTTPS from a mobile device.

### SM-2 · RN scaffold + call-screen UI  · Story · 3 pts · High · (Done — M0)
**Description:** React Native (TS) app with the single call screen — header + theme toggle,
Sanas model picker (chips), Call/Hang-up, timer, Model on/off, status line. Already
implemented in this repo (`App.tsx`, `src/`); use as the starting point.
**Acceptance criteria:**
- App builds and renders the call screen in light and dark.
- Model list loads from `GET /api/models`.

### SM-3 · Twilio Voice: token + outgoing connect (audible call)  · Story · 5 pts · Highest
**Description:** Integrate `@twilio/voice-react-native-sdk`; on Call, fetch a token and
`connect(token, { mode: 'sanas', model })`; play call audio.
**Acceptance criteria:**
- Tapping Call connects within ~5s on a device/simulator and audio is audible.
- The call's `CallSid` is captured on connect (for mid-call control).
- Disconnect cleanly ends the call and resets UI.

### SM-4 · Microphone permission UX  · Story · 2 pts · High
**Description:** iOS uses `NSMicrophoneUsageDescription` (prompt on first use); Android
requests `RECORD_AUDIO` at runtime before connecting; handle denial gracefully.
**Acceptance criteria:**
- First call triggers the OS mic prompt on both platforms.
- Denying mic shows a clear, recoverable message; app stays usable.

### SM-5 · Call controls & states (green in-call + timer)  · Story · 2 pts · Medium
**Description:** Call button is brand-dark when idle, shows a spinner while connecting, turns
**green** while connected; a live **mm:ss** timer runs during the call; Hang-up enabled only
during a call.
**Acceptance criteria:**
- States match the mockup (idle / connecting / on-call).
- Timer starts on connect, stops + resets on hang-up.

### SM-6 · Mid-call Model on/off  · Story · 3 pts · Highest
**Description:** "Model on / Model off" `POST /api/twilio/toggle { call_sid, enabled }` during
the call.
**Acceptance criteria:**
- Model off audibly returns the raw line; Model on restores processing.
- The call does **not** drop on toggle.
- Controls are enabled only while connected.

### SM-7 · Live model switch mid-call  · Story · 3 pts · High
**Description:** Tapping a different model chip while connected `POST /api/twilio/toggle
{ call_sid, model }` and updates the selection.
**Acceptance criteria:**
- Switching models changes the audio without dropping the call.
- Selecting a model while idle sets the model used for the next call.

### SM-8 · Audio session & routing  · Story · 3 pts · Medium
**Description:** Correct audio session handling on both platforms — earpiece/speaker/Bluetooth
routing, echo, interruptions (incoming OS call), ringer/silent.
**Acceptance criteria:**
- Audible on earpiece and speaker; works with a Bluetooth headset.
- No persistent echo; recovers after an OS interruption.

### SM-9 · Resilience: failures, network loss, background  · Story · 3 pts · Medium
**Description:** Handle connect failure, mid-call network loss/reconnect, app
background/foreground, and token/endpoint errors with clear states.
**Acceptance criteria:**
- Connect failure shows a message and resets to idle.
- Backgrounding during a call keeps audio (background modes) or ends gracefully.

### SM-10 · App identity & assets  · Task · 2 pts · Medium
**Description:** Final app name, bundle id (`ai.sanas.…`), 1024px icon, splash; light/dark
polish; store screenshots from the mockup/app.
**Acceptance criteria:**
- Icon + splash on both platforms; name + bundle id set.

### SM-11 · iOS release build (TestFlight)  · Task · 3 pts · Medium
**Description:** Signing/provisioning, bump version, Archive, distribute to App Store Connect.
**Acceptance criteria:**
- Installs from TestFlight and completes a call.

### SM-12 · Android release build (Play internal testing)  · Task · 3 pts · Medium
**Description:** `applicationId`, release keystore, `bundleRelease` → `.aab` to Play Console.
**Acceptance criteria:**
- Installs from Play internal testing and completes a call.

---

## Dependencies
- **SM-1 blocks** SM-3, SM-6, SM-7 (no real audio without a `real`-mode, reachable backend).
- SM-3 blocks SM-4/5/6/7. SM-10 blocks SM-11/12.

## How to import the CSV
1. Jira → **Filters / Issues → Import issues from CSV** (or Project settings → Import) and
   upload `docs/jira-import.csv`.
2. Map columns: `Issue Type`, `Summary`, `Description`, `Epic Name` (epic row), `Epic Link`
   (child rows → links to the epic), `Priority`, `Labels`. Map `Story Points` to your
   estimation field if present.
3. Import the **Epic first** (or in the same file — the importer links children by Epic Name).
4. After import, set Components and adjust Sprint/Fix Version as needed.

> Note: Jira CSV import varies between team-managed and company-managed projects. If `Epic
> Link` doesn't link, import the epic, then re-import children mapping `Epic Link` → the
> epic's key, or set the parent in bulk-edit. The manual blocks above are the fallback.
