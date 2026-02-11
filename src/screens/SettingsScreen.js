import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  Text,
  Switch,
  List,
  Divider,
  RadioButton,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const SETTINGS_KEYS = {
  TTS_RATE: "tts_rate",
  HAPTICS: "haptics_enabled",
  SHUFFLE: "quiz_shuffle",
};

export default function SettingsScreen() {
  const [ttsRate, setTtsRate] = useState("normal");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [shuffleQuiz, setShuffleQuiz] = useState(true);

  /* =====================
     🔄 LOAD SETTINGS
     ===================== */
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const values = await AsyncStorage.multiGet([
      SETTINGS_KEYS.TTS_RATE,
      SETTINGS_KEYS.HAPTICS,
      SETTINGS_KEYS.SHUFFLE,
    ]);

    values.forEach(([key, value]) => {
      if (value === null) return;

      switch (key) {
        case SETTINGS_KEYS.TTS_RATE:
          setTtsRate(value);
          break;
        case SETTINGS_KEYS.HAPTICS:
          setHapticsEnabled(value === "true");
          break;
        case SETTINGS_KEYS.SHUFFLE:
          setShuffleQuiz(value === "true");
          break;
      }
    });
  };

  const saveSetting = async (key, value) => {
    await AsyncStorage.setItem(key, value.toString());
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  /* =====================
     🧹 RESET
     ===================== */
  const resetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "This will clear all quiz scores and last studied data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const progressKeys = keys.filter(
              (k) =>
                k.includes("_last_score") ||
                k.includes("_last_studied")
            );

            await AsyncStorage.multiRemove(progressKeys);

            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* STUDY */}
        <List.Section title="Speech Speed">
          <RadioButton.Group
            onValueChange={(val) => {
              setTtsRate(val);
              saveSetting(SETTINGS_KEYS.TTS_RATE, val);
            }}
            value={ttsRate}
          >
            <RadioButton.Item label="Slow" value="slow" />
            <RadioButton.Item label="Normal" value="normal" />
            <RadioButton.Item label="Fast" value="fast" />
          </RadioButton.Group>

          <Divider />

          <List.Item
            style={styles.listItem}
            title="Haptic Feedback"
            left={() => <List.Icon icon="vibrate" />}
            right={() => (
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  setHapticsEnabled(val);
                  saveSetting(SETTINGS_KEYS.HAPTICS, val);
                }}
              />
            )}
          />
        </List.Section>

        {/* QUIZ */}
        <List.Section title="Quiz">
          <List.Item
            style={styles.listItem}
            title="Shuffle Questions"
            left={() => <List.Icon icon="shuffle-variant" />}
            right={() => (
              <Switch
                value={shuffleQuiz}
                onValueChange={(val) => {
                  setShuffleQuiz(val);
                  saveSetting(SETTINGS_KEYS.SHUFFLE, val);
                }}
              />
            )}
          />

          <List.Item
            style={styles.listItem}
            title="Pass Criteria"
            description="Miss ≤1 if under 5 questions, otherwise 70%"
            left={() => <List.Icon icon="information-outline" />}
          />
        </List.Section>

        {/* DATA */}
        <List.Section title="Data">
          <List.Item
            style={styles.listItem}
            title="Reset Progress"
            titleStyle={{ color: "#d32f2f" }}
            left={() => (
              <List.Icon icon="trash-can-outline" color="#d32f2f" />
            )}
            onPress={resetProgress}
          />
        </List.Section>

        {/* ABOUT */}
        <List.Section title="About">
          <List.Item title="Version" description="1.0.0" />
        </List.Section>
      </View>
    </SafeAreaView>
  );
}

/* =====================
   🎨 STYLES
   ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  listItem: {
    marginLeft: 12
  }
});
