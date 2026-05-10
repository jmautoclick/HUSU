import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husu.habits',
  appName: 'Husu Habits',
  webDir: 'dist',
  android: {
    backgroundColor: '#0b0a14',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0a14',
    },
  },
};

export default config;
