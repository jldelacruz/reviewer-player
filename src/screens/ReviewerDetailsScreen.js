import React, { useState, useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  IconButton,
  Card,
  Button,
  ProgressBar,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
  TTS_ENABLED: "tts_enabled",
  TTS_RATE: "tts_rate",
};

export default function ReviewerDetailsScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const [qnas, setQnas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(1.0);

  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  /* =========================
     🔄 LOAD ON FOCUS
     ========================= */
  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadQnA();
      stopTTS();

      return () => stopTTS();
    }, [])
  );

  /* =========================
     ⚙️ SETTINGS
     ========================= */
  const loadSettings = async () => {
    const values = await AsyncStorage.multiGet([
      SETTINGS_KEYS.HAPTICS,
      SETTINGS_KEYS.TTS_ENABLED,
      SETTINGS_KEYS.TTS_RATE,
    ]);

    values.forEach(([key, value]) => {
      if (value === null) return;

      if (key === SETTINGS_KEYS.HAPTICS) {
        setHapticsEnabled(value === "true");
      }

      if (key === SETTINGS_KEYS.TTS_ENABLED) {
        setTtsEnabled(value === "true");
      }

      if (key === SETTINGS_KEYS.TTS_RATE) {
        setTtsRate(
          value === "slow" ? 0.8 :
          value === "fast" ? 1.2 :
          1.0
        );
      }
    });
  };

  const loadQnA = async () => {
    const key = `reviewer_${reviewer.id}_qa`;
    const saved = await AsyncStorage.getItem(key);
    setQnas(saved ? JSON.parse(saved) : []);
  };

  /* =========================
     📳 HAPTICS
     ========================= */
  const impact = async (type = "light") => {
    if (!hapticsEnabled) return;

    await Haptics.impactAsync(
      type === "medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
  };

  /* =========================
     🔊 TTS PLAYLIST MODE
     ========================= */
  const playAll = () => {
    if (!ttsEnabled || currentIndexRef.current >= qnas.length) {
      stopTTS();
      return;
    }

    const item = qnas[currentIndexRef.current];
    isPlayingRef.current = true;

    Speech.stop();

    Speech.speak(`Question. ${item.question}`, {
      rate: ttsRate,
      onDone: () => {
        if (!isPlayingRef.current) return;

        Speech.speak(`Answer. ${item.answer}`, {
          rate: ttsRate,
          onDone: () => {
            if (!isPlayingRef.current) return;

            const nextIndex = currentIndexRef.current + 1;

            if (nextIndex >= qnas.length) {
              stopTTS(); // ⛔ stop at last item
              return;
            }

            currentIndexRef.current = nextIndex;
            setCurrentIndex(nextIndex);
            playAll();
          },
        });
      },
    });
  };

  const stopTTS = () => {
    isPlayingRef.current = false;
    Speech.stop();
    setIsPlaying(false);
  };

  const togglePlay = async () => {
    await impact("medium");

    if (!ttsEnabled || qnas.length === 0) return;

    if (isPlaying) {
      stopTTS();
    } else {
      setIsPlaying(true);
      playAll();
    }
  };

  const next = async () => {
    await impact();

    if (currentIndexRef.current < qnas.length - 1) {
      currentIndexRef.current += 1;
      setCurrentIndex(currentIndexRef.current);

      if (isPlayingRef.current) {
        playAll();
      }
    }
  };

  const prev = async () => {
    await impact();

    if (currentIndexRef.current > 0) {
      currentIndexRef.current -= 1;
      setCurrentIndex(currentIndexRef.current);

      if (isPlayingRef.current) {
        playAll();
      }
    }
  };

  const current = qnas[currentIndex];
  const progress =
    qnas.length > 0 ? (currentIndex + 1) / qnas.length : 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => {
              impact();
              navigation.goBack();
            }}
          />
          <Text variant="headlineSmall" style={styles.title}>
            {reviewer.title}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {/* QNA CARD */}
        <Card style={styles.card}>
          <Card.Content>
            {current ? (
              <>
                <Text style={styles.label}>Question</Text>
                <Text style={styles.question}>
                  {current.question}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Answer</Text>
                <Text style={styles.answer}>
                  {current.answer}
                </Text>
              </>
            ) : (
              <Text style={styles.empty}>
                No Q&A yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* PROGRESS */}
        <View style={{ marginTop: 16 }}>
          <ProgressBar progress={progress} />
          <Text style={styles.progressText}>
            {currentIndex + 1} / {qnas.length}
          </Text>
        </View>

        {/* PLAYER CONTROLS */}
        <View style={styles.controls}>
          <IconButton
            icon="skip-previous"
            size={40}
            disabled={currentIndex === 0}
            onPress={prev}
          />

          <IconButton
            icon={isPlaying ? "pause-circle" : "play-circle"}
            size={72}
            iconColor="#4A90E2"
            disabled={!ttsEnabled || qnas.length === 0}
            onPress={togglePlay}
          />

          <IconButton
            icon="skip-next"
            size={40}
            disabled={currentIndex === qnas.length - 1}
            onPress={next}
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="clipboard-check-outline"
            onPress={() => {
              impact();
              navigation.navigate("Quiz", { reviewer });
            }}
          >
            Take Quiz
          </Button>

          <Button
            mode="outlined"
            icon="book-open-page-variant"
            onPress={() => {
              impact();
              navigation.navigate("QnA", { reviewer });
            }}
          >
            Manage Q&A
          </Button>
        </View>
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
    padding: 20,
    backgroundColor: "#FFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    marginTop: 24,
    borderRadius: 20,
    elevation: 4,
  },

  label: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 6,
  },

  question: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },

  answer: {
    fontSize: 16,
    opacity: 0.75,
    lineHeight: 24,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },

  empty: {
    textAlign: "center",
    opacity: 0.5,
    paddingVertical: 40,
  },

  progressText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 12,
    opacity: 0.6,
  },

  controls: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  actions: {
    marginTop: "auto",
    gap: 12,
  },
});
