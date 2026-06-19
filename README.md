# Sanas Mobile — Live Call (example)

A focused **React Native** app that does one thing: an **in-app voice call** where your
voice is processed by a **Sanas** model in real time, with **mid-call model on/off and
live model switching**. It uses the first-party [Twilio Voice React Native SDK](https://github.com/twilio/twilio-voice-react-native-sdk)
and talks to the **same backend** as the Sanas web consultant.

**In scope:** the voice call + Sanas model picker + Model on / Model off (mid-stream) +
call timer + light/dark.
**Deliberately out of scope:** the chatbot, RAG / knowledge base, and any data/file upload.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Sanas Mobile (this app)    │  HTTPS │  Sanas backend (FastAPI)     │
│  • GET /api/twilio/token    │ ─────► │  • mints a Voice access token│
│  • GET /api/models          │        │  • lists Sanas models        │
│  • Twilio Voice SDK connect │ ◄────► │  • TwiML App → /api/twilio/   │
│  • POST /api/twilio/toggle  │        │    voice (mode=sanas) streams │
│    (call_sid, enabled,model)│        │    audio through Sanas        │
└─────────────────────────────┘        └──────────────────────────────┘
```

No Twilio or Sanas credentials live in the app — the backend mints a short-lived access
token at call time. The app only stores the **backend URL**.

## Prerequisites

- React Native toolchain — see [Set up your environment](https://reactnative.dev/docs/set-up-your-environment) (Node ≥ 22, Watchman, JDK, **Xcode** for iOS, **Android Studio** for Android, CocoaPods).
- The **Sanas backend** running and reachable over HTTPS, with browser/voice Twilio
  configured (`TWILIO_API_KEY_SID/SECRET`, `TWILIO_TWIML_APP_SID`, `PUBLIC_BASE_URL`) and
  the TwiML App Voice URL pointing at `{PUBLIC_BASE_URL}/api/twilio/voice`.
- For store distribution: an **Apple Developer** account and a **Google Play Developer**
  account (signing + submission).

## Configure the backend URL

Edit [`src/config.ts`](src/config.ts):

```ts
export const BACKEND_URL = 'https://your-backend.example.com';
export const DEFAULT_MODEL = 'AGENTIC_VI_GT_NC'; // 8 kHz telephony NC
```

During development you can point at the pinned ngrok tunnel (works from a real device):
`https://overcast-acronym-traction.ngrok-free.dev`. (iOS simulator can also reach a host
`http://localhost:8000`, but App Transport Security blocks plain http — use the https tunnel.)

## Install & run

```bash
npm install
# iOS (first time + after native dep changes)
bundle install            # once
bundle exec pod install --project-directory=ios
npm run ios               # or: open ios/SanasMobile.xcworkspace in Xcode and Run

# Android (emulator running or device attached)
npm run android
```

> The Twilio Voice SDK is a **native module**, so this needs a real build (Xcode /
> Android Studio) — it does **not** run in Expo Go. Mic permission is requested at first
> call (`NSMicrophoneUsageDescription` on iOS; `RECORD_AUDIO` runtime prompt on Android).

## How the call works

1. Tap **Call** → the app fetches a Voice token (`/api/twilio/token`) and `connect()`s with
   params `{ mode: 'sanas', model }`.
2. Twilio routes to the TwiML App → `/api/twilio/voice?mode=sanas` → a `<Connect><Stream>`
   that runs your audio through the chosen Sanas model and plays it back — you hear yourself
   processed live.
3. **Model on / Model off** and tapping a different **model** chip `POST /api/twilio/toggle`
   with the live `call_sid`, so Sanas flips / switches **without dropping the call**.
4. The **Call** button turns green and a timer runs while connected; **Hang-up** ends it.

> Real processed audio requires the backend's Sanas SDK to be in **real** mode. If the
> backend is in mock mode the call still connects, but you'll hear the raw line.

## Build for the stores (high level)

- **iOS:** set the bundle id + signing team in Xcode, bump `MARKETING_VERSION`, Archive →
  distribute to App Store Connect / TestFlight.
- **Android:** set `applicationId`, create a release keystore, `cd android && ./gradlew
  bundleRelease` → upload the `.aab` to the Play Console.

## Project layout

```
App.tsx              # the single call screen (UI, timer, in-call state)
src/config.ts        # BACKEND_URL, default model, call mode
src/api.ts           # token / models / toggle (backend client)
src/voice.ts         # useVoiceCall() — wraps @twilio/voice-react-native-sdk
src/theme.ts         # Sanas light/dark palette
ios/ android/        # native projects (permissions added for the mic)
```
