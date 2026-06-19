// Sanas brand palette, light + dark (mirrors the web app's tokens).
export type Theme = {
  mode: 'light' | 'dark';
  bg: string;        // screen background
  surface: string;   // cards / rows
  field: string;     // inputs / chips
  text: string;      // primary text
  textSoft: string;  // secondary text
  border: string;
  green: string;
  greenDeep: string;
  brandInk: string;  // brand-dark button background
  onBrand: string;   // text on brand-dark / on green
  danger: string;
};

const green = '#44eca0';
const greenDeep = '#16c47f';

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#ffffff',
  surface: '#ffffff',
  field: '#f7f7f7',
  text: '#0a0a0a',
  textSoft: '#767676',
  border: '#e3e3e3',
  green,
  greenDeep,
  brandInk: '#0a0a0a',
  onBrand: '#ffffff',
  danger: '#b4361e',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0f1217',
  surface: '#1a1e25',
  field: '#232831',
  text: '#e9ebef',
  textSoft: '#aab1bd',
  border: '#313742',
  green,
  greenDeep,
  brandInk: '#262b33',
  onBrand: '#ffffff',
  danger: '#ff6b6b',
};
