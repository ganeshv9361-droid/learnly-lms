import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.learnly.app',
  appName: 'Learnly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'learnly-lms-hqch.onrender.com',
      '*.supabase.co',
      '*.razorpay.com',
      'checkout.razorpay.com'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#080810',
    minSdkVersion: 22,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#080810',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;