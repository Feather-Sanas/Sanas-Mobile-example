// React hook wrapping the first-party Twilio Voice React Native SDK for a single
// outgoing "hear yourself through Sanas" call. The backend's TwiML App routes the
// call to /api/twilio/voice (mode=sanas), which streams the audio through the chosen
// Sanas model; we expose the CallSid so mid-call on/off + model switching can target it.
import {useCallback, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {Voice, Call} from '@twilio/voice-react-native-sdk';
import {getToken} from './api';

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting';

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS prompts on first mic use (NSMicrophoneUsageDescription)
  }
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone access',
      message: 'Sanas needs the microphone for the live call.',
      buttonPositive: 'OK',
    },
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

export function useVoiceCall() {
  const voiceRef = useRef<Voice | null>(null);
  const callRef = useRef<Call | null>(null);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [sid, setSid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!voiceRef.current) {
    voiceRef.current = new Voice();
  }

  const connect = useCallback(async (params: Record<string, string>) => {
    if (callRef.current) {
      return;
    }
    setError(null);
    const granted = await ensureMicPermission();
    if (!granted) {
      setError('Microphone permission denied — enable it in Settings to make a call.');
      return;
    }
    setStatus('connecting');
    try {
      const token = await getToken();
      const call = await voiceRef.current!.connect(token, {params});
      callRef.current = call;

      call.on(Call.Event.Connected, async () => {
        setStatus('connected');
        try {
          const s = await call.getSid();
          if (s) {
            setSid(s);
          }
        } catch {
          /* sid may arrive slightly later; toggle falls back to no-op without it */
        }
      });
      const end = () => {
        setStatus('idle');
        setSid(null);
        callRef.current = null;
      };
      call.on(Call.Event.Disconnected, end);
      call.on(Call.Event.ConnectFailure, (e: any) => {
        setError(e?.message || 'The call could not be connected.');
        end();
      });
    } catch (e: any) {
      setError(e?.message || String(e));
      setStatus('idle');
      callRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    const c = callRef.current;
    if (!c) {
      return;
    }
    setStatus('disconnecting');
    try {
      c.disconnect();
    } catch {
      /* the Disconnected event still resets state */
    }
  }, []);

  return {status, sid, error, connect, disconnect};
}
