import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.byrds.beatnik',
  appName: 'Beatnik',
  webDir: 'www',
  // handle insecure websocket connections
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
