import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husu.habits',
  appName: 'Husu Habits',
  webDir: 'dist',
  android: {
    backgroundColor: '#2A2823',
  },
  ios: {
    backgroundColor: '#2A2823',
    contentInset: 'never',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2A2823',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C97B5A',
      sound: 'beep.wav',
    },
  },
};

export default config;
