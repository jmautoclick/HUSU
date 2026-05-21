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
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2A2823',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C97B5A',
    },
  },
};

export default config;
