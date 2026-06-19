/**
 * Sanas Mobile (example) — a focused React Native app: the Twilio in-app voice call
 * with mid-call Sanas model on/off and live model switching. No chatbot, no RAG, no
 * uploads. The call routes through the same backend as the web app; your voice is
 * processed by the selected Sanas model in real time so you can hear it on/off live.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {CALL_MODE, DEFAULT_MODEL} from './src/config';
import {getModels, toggle, type Model} from './src/api';
import {useVoiceCall} from './src/voice';
import {darkTheme, lightTheme, type Theme} from './src/theme';

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function App(): React.JSX.Element {
  const system = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(system === 'dark' ? 'dark' : 'light');
  const t = mode === 'dark' ? darkTheme : lightTheme;
  const s = useMemo(() => makeStyles(t), [t]);

  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [enabled, setEnabled] = useState(true); // Sanas on/off
  const [secs, setSecs] = useState(0);

  const {status, sid, error, connect, disconnect} = useVoiceCall();
  const inCall = status === 'connected';
  const busy = status === 'connecting' || status === 'disconnecting';

  // load the model list once
  useEffect(() => {
    getModels().then(ms => {
      if (ms.length) {
        setModels(ms);
        if (!ms.find(m => m.name === DEFAULT_MODEL)) {
          setModel(ms[0].name);
        }
      }
    });
  }, []);

  // call timer
  useEffect(() => {
    if (status !== 'connected') {
      setSecs(0);
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => setSecs(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [status]);

  // Sanas starts on for each new call
  useEffect(() => {
    if (status === 'connected') {
      setEnabled(true);
    }
  }, [status]);

  const onCall = useCallback(() => {
    connect({mode: CALL_MODE, model});
  }, [connect, model]);

  const setModelOn = useCallback(
    (on: boolean) => {
      setEnabled(on);
      if (inCall && sid) {
        toggle({call_sid: sid, enabled: on});
      }
    },
    [inCall, sid],
  );

  const pickModel = useCallback(
    (name: string) => {
      setModel(name);
      if (inCall && sid) {
        setEnabled(true);
        toggle({call_sid: sid, model: name, enabled: true});
      }
    },
    [inCall, sid],
  );

  const statusText = error
    ? error
    : status === 'connecting'
    ? 'Connecting…'
    : status === 'connected'
    ? 'On call — hearing yourself through Sanas. Toggle the model on/off or switch it live.'
    : status === 'disconnecting'
    ? 'Ending…'
    : 'Tap Call to hear your voice processed by Sanas in real time.';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={t.bg}
      />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.brand}>
            <View style={s.dot} />
            <Text style={s.brandText}>Sanas · Live Call</Text>
          </View>
          <Pressable
            style={s.themeBtn}
            onPress={() => setMode(m => (m === 'dark' ? 'light' : 'dark'))}
            accessibilityLabel="Toggle dark mode">
            <Text style={s.themeIcon}>{mode === 'dark' ? '☀' : '☾'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          {/* Model picker */}
          <Text style={s.label}>Sanas model</Text>
          {models.length === 0 ? (
            <Text style={s.soft}>Loading models…</Text>
          ) : (
            <View style={s.chips}>
              {models.map(m => {
                const on = m.name === model;
                return (
                  <Pressable
                    key={m.name}
                    onPress={() => pickModel(m.name)}
                    style={[s.chip, on && s.chipOn]}>
                    <Text style={[s.chipText, on && s.chipTextOn]} numberOfLines={1}>
                      {m.label || m.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Call / Hang-up + timer */}
          <View style={s.callRow}>
            <Pressable
              disabled={inCall || busy}
              onPress={onCall}
              style={[s.callBtn, inCall && s.callBtnInCall, busy && !inCall && s.btnDim]}>
              {status === 'connecting' ? (
                <ActivityIndicator color={t.onBrand} />
              ) : (
                <Text style={s.callBtnText}>{inCall ? 'On call' : 'Call'}</Text>
              )}
            </Pressable>
            <Pressable
              disabled={!inCall && status !== 'connecting'}
              onPress={disconnect}
              style={[s.hangBtn, !inCall && status !== 'connecting' && s.btnDim]}>
              <Text style={s.hangBtnText}>Hang-up</Text>
            </Pressable>
            <Text style={[s.timer, inCall && s.timerOn]}>{mmss(secs)}</Text>
          </View>

          {/* Mid-call model on/off */}
          <Text style={s.label}>Mid-call</Text>
          <View style={s.toggleRow}>
            <Pressable
              disabled={!inCall}
              onPress={() => setModelOn(true)}
              style={[s.toggle, enabled && s.toggleOnGreen, !inCall && s.btnDim]}>
              <Text style={[s.toggleText, enabled && s.toggleTextActive]}>Model on</Text>
            </Pressable>
            <Pressable
              disabled={!inCall}
              onPress={() => setModelOn(false)}
              style={[s.toggle, !enabled && s.toggleOnDark, !inCall && s.btnDim]}>
              <Text style={[s.toggleText, !enabled && s.toggleTextActive]}>Model off</Text>
            </Pressable>
          </View>

          <Text style={s.status}>{statusText}</Text>
          <Text style={s.footnote}>
            Your voice is processed live by the selected Sanas model. Switching the model
            or toggling it off takes effect mid-call.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: t.bg},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    brand: {flexDirection: 'row', alignItems: 'center', gap: 9},
    dot: {width: 12, height: 12, borderRadius: 6, backgroundColor: t.greenDeep},
    brandText: {color: t.text, fontSize: 17, fontWeight: '700'},
    themeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
    },
    themeIcon: {fontSize: 17, color: t.text},

    body: {padding: 18, gap: 10},
    label: {
      color: t.textSoft,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 8,
    },
    soft: {color: t.textSoft, fontSize: 13},

    chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    chip: {
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.field,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 13,
    },
    chipOn: {borderColor: t.greenDeep, backgroundColor: 'rgba(22,196,127,0.12)'},
    chipText: {color: t.text, fontSize: 13, fontWeight: '600', maxWidth: 240},
    chipTextOn: {color: t.greenDeep},

    callRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8},
    callBtn: {
      backgroundColor: t.brandInk,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 22,
      minWidth: 110,
      alignItems: 'center',
    },
    callBtnInCall: {backgroundColor: t.greenDeep},
    callBtnText: {color: t.onBrand, fontSize: 16, fontWeight: '700'},
    hangBtn: {
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignItems: 'center',
    },
    hangBtnText: {color: t.text, fontSize: 16, fontWeight: '700'},
    btnDim: {opacity: 0.45},
    timer: {
      marginLeft: 'auto',
      fontSize: 22,
      fontWeight: '800',
      color: t.textSoft,
      fontVariant: ['tabular-nums'],
    },
    timerOn: {color: t.greenDeep},

    toggleRow: {flexDirection: 'row', gap: 10},
    toggle: {
      flex: 1,
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
    },
    toggleOnGreen: {backgroundColor: t.greenDeep, borderColor: t.greenDeep},
    toggleOnDark: {backgroundColor: t.brandInk, borderColor: t.brandInk},
    toggleText: {color: t.textSoft, fontSize: 14, fontWeight: '700'},
    toggleTextActive: {color: t.onBrand},

    status: {color: t.text, fontSize: 13.5, lineHeight: 20, marginTop: 14},
    footnote: {color: t.textSoft, fontSize: 12, lineHeight: 18, marginTop: 6},
  });
}

export default App;
