# PRD — Sanas Mobile: In-App Live Voice Call

| | |
|---|---|
| **Status** | Draft / for backlog |
| **Author** | — |
| **Last updated** | 2026-06-18 |
| **Target platforms** | iOS + Android (React Native) |
| **Mockup** | `docs/mockup.html` (interactive) |
| **Reference implementation** | this repo (`Sanas-Mobile-example`) + the web consultant's `/api/twilio/*` backend |

---

## 1. Summary

A small, single-purpose mobile app that lets a user place an **in-app voice call** and hear
their own voice **processed by a Sanas model in real time**, with the ability to flip the
model **on/off** and **switch models live, mid-call**. It is the mobile counterpart of the
"Call in the browser" feature in the Sanas web consultant, reusing the same backend.

This is intentionally a **focused demo / sales-enablement app** — not a port of the whole
web experience.

## 2. Problem & motivation

Prospects and field teams want to *hear* the difference Sanas makes, on a real phone, over a
real call path — not just on a desktop browser. A native app that demonstrates the live
model on a mobile device (the device most calls actually happen on) is a stronger, more
credible demo and a reusable asset for sales/partnerships.

## 3. Goals & non-goals

**Goals**
- Place a real-time voice call from the phone where the caller hears their own voice through a
  chosen Sanas model.
- Toggle the Sanas model **on/off** and **switch models** without dropping the call.
- Clear call affordances: Call, Hang-up, a green "in-call" state, and a live timer.
- Light/dark, on-brand, ships to the App Store and Play Store.

**Non-goals (explicitly out of scope)**
- The Sani **chatbot** / LLM conversation.
- **RAG** / knowledge base and **any document or data upload**.
- Dialing third parties, IVR, "talk to a human," guided demo, or the in-path bridge.
- The audio Playground, ASR/WER comparison, spectrograms, ROI calculator, booking flow.

## 4. Target users

- **Sales / SE / partnerships** running live demos on a phone.
- **Prospects** trying Sanas hands-free during/after a meeting.
- (Secondary) **internal QA** spot-checking model behavior on mobile networks.

## 5. User stories

- *As a seller,* I tap **Call**, speak, and hear my voice cleaned by Sanas so I can show the
  effect instantly.
- *As a prospect,* I tap **Model off** mid-call and hear the raw line, then **Model on** to
  hear the difference — the A/B is the "wow."
- *As a seller,* I switch from the telephony NC model to Speech Enhancement **during the
  call** to compare models without hanging up.
- *As any user,* I end the call with **Hang-up** and the timer/state reset cleanly.
- *As any user,* the app respects my **dark mode** preference.

## 6. UX / screens

Single screen (see `docs/mockup.html`). States:

| State | Call button | Hang-up | Timer | Model on/off |
|---|---|---|---|---|
| **Idle** | "Call" (brand-dark), enabled | disabled | `00:00`, muted | disabled |
| **Connecting** | spinner, disabled | enabled | `00:00` | disabled |
| **On call** | "On call" (**green**), disabled | enabled | running (green) | enabled |

- **Model picker** — chips of available Sanas models; the selected one is highlighted.
  Tapping a chip mid-call switches the live model.
- **Mid-call** — "Model on" / "Model off" segmented control; the active one is highlighted.
- **Header** — brand + a light/dark toggle.
- **Status line** — plain-language state + a one-line explainer.

Accessibility: labelled controls, adequate tap targets, color choices meet contrast in both
themes.

## 7. Functional requirements

- **FR-1** App fetches a short-lived Twilio Voice access token from the backend
  (`GET /api/twilio/token`); **no Twilio/Sanas credentials are stored in the app**.
- **FR-2** App lists models from `GET /api/models` and defaults to the 8 kHz telephony model
  (`AGENTIC_VI_GT_NC`).
- **FR-3** Tapping **Call** requests microphone permission, then connects via the Twilio Voice
  SDK with params `{ mode: "sanas", model }` (the backend streams the audio through Sanas).
- **FR-4** While connected, the app holds the call's `CallSid`.
- **FR-5** **Model on/off** and **model switch** `POST /api/twilio/toggle` with
  `{ call_sid, enabled }` / `{ call_sid, model }`; changes apply **without dropping the call**.
- **FR-6** **Call button is green** and a **mm:ss timer** runs while connected; **Hang-up**
  ends the call and resets state; the recording is *not* a requirement here.
- **FR-7** Mic permission denial shows a clear, recoverable message.
- **FR-8** Light/dark theme, defaulting to the OS setting.
- **FR-9** Backend URL is configurable for dev (ngrok) vs production.

## 8. Technical design

- **Framework:** React Native (TypeScript). Chosen over Flutter because Twilio ships a
  **first-party** Voice React Native SDK and we can reuse the web app's API contract directly.
- **Call SDK:** `@twilio/voice-react-native-sdk` (native module → real build, not Expo Go).
- **Backend (unchanged, shared with web):**
  - `GET /api/twilio/token` → access token (signed server-side from the TwiML App + API key).
  - `GET /api/models` → model list.
  - `POST /api/twilio/toggle { call_sid, enabled?, model? }` → mid-call on/off + live model
    switch (recreates the Sanas processor without dropping the call).
  - The TwiML App's Voice URL → `/api/twilio/voice?mode=sanas` returns the `<Connect><Stream>`
    that runs the caller's audio through the selected Sanas model and plays it back.
- **Permissions:** iOS `NSMicrophoneUsageDescription` (+ audio/voip background modes);
  Android `RECORD_AUDIO` (runtime), `MODIFY_AUDIO_SETTINGS`, `INTERNET`, Bluetooth for audio
  routing.
- **Call flow:** Call → token → `voice.connect(token, {params})` → on `Connected` capture
  `CallSid`, start timer, enable mid-call controls → toggle/switch via `/api/twilio/toggle`
  → `Hang-up` → `disconnect()` → reset.

## 9. Dependencies & prerequisites

- **Backend reachable over HTTPS** with browser/voice Twilio configured
  (`TWILIO_API_KEY_SID/SECRET`, `TWILIO_TWIML_APP_SID`, `PUBLIC_BASE_URL`) and the TwiML App
  Voice URL pointing at `{PUBLIC_BASE_URL}/api/twilio/voice`. (A stable/pinned tunnel or a
  real domain — a rotating URL breaks the call path.)
- **Sanas SDK in `real` mode** on the backend to hear *processed* audio (mock = raw line; the
  call still connects).
- **Apple Developer** ($99/yr) + **Google Play Developer** ($25 one-time) accounts; signing.
- Build tooling: Xcode (iOS), Android Studio + JDK (Android), CocoaPods, Node ≥ 22.

## 10. Milestones

1. **M0 — Scaffold & UI (done in this repo):** RN app, single call screen, theme, model
   picker, in-call states, backend client. *No verified on-device call yet.*
2. **M1 — Working call on a simulator/device:** token + `connect` + audio audible; mic
   permission flow on both platforms.
3. **M2 — Mid-call controls verified:** model on/off + live switch confirmed audible end-to-end
   against a `real`-mode backend.
4. **M3 — Hardening:** error/reconnect states, network loss, background/foreground, audio
   routing (speaker/earpiece/Bluetooth), icons/splash.
5. **M4 — Store builds:** signing, TestFlight + Play internal testing, store listings.

## 11. Acceptance criteria

- From a physical device on cellular, **Call** connects within a few seconds and the caller
  hears their own voice processed by the selected model.
- **Model off** audibly returns the raw line; **Model on** restores processing; **switching
  models** changes the sound — all **without dropping the call**.
- Call button is green and the timer runs while connected; **Hang-up** cleanly ends and resets.
- Denying mic permission yields a clear message and the app remains usable.
- Builds install and run from TestFlight (iOS) and Play internal testing (Android).

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Twilio Voice SDK native setup friction (pods/Gradle, versions) | Pin SDK version; document `pod install`; CI build early. |
| Backend not in `real` mode → demo sounds raw | Pre-demo checklist: `/api/health` shows `mode:real`; auto-retry init server-side. |
| Tunnel/URL changes break the call path | Use the pinned domain / production URL; verify TwiML App Voice URL matches. |
| Mobile audio routing / echo on speaker | Test earpiece/speaker/Bluetooth; rely on SDK's audio session handling. |
| App Store review of a "demo" app | Frame as a product demo with clear purpose; standard mic-usage string. |

## 13. Success metrics

- Time-to-first-audible-call < ~5s on a normal connection.
- Demo completion rate (Call → at least one model toggle) in sessions.
- Qualitative: field/sales adoption for live demos.

## 14. Open questions

- Production backend home (still TBD) and its public URL.
- App identity: final name, bundle id (`ai.sanas.…`), icon/splash assets.
- Should the app also expose the in-path **bridge** (call a real number, they hear you
  cleaned) later, or stay hear-yourself only?
- Auth/gating — open demo vs. require a code/login?
