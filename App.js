import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from "react-native";
import { DefaultTheme, PaperProvider } from "react-native-paper";

import AppNavigation from "./src/navigations/AppNavigation";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AppNavigation />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4A90E2",
    secondary: "#F5A623",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#333",
  },
};
