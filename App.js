
import { useEffect } from "react";
import { StyleSheet, Text, View } from 'react-native';

import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { Audio } from "expo-av";

import AppNavigation from './src/navigations/AppNavigation';

export default function App() {
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,     // 🔑 iOS silent switch
      staysActiveInBackground: true,  // 🔑 background audio
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <AppNavigation />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4A90E2",
    accent: "#F5A623",
    background: "#fff",
    text: "#333",
  },
};

