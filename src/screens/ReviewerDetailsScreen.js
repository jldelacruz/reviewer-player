import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Button,
  IconButton,
  ProgressBar,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

export default function ReviewerDetailsScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const [lastScore, setLastScore] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [qnas, setQnas] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentIndexRef = useRef(0);

  useEffect(() => {
    loadStats();
    return () => Speech.stop();
  }, []);

  const loadStats = async () => {
    const scoreKey = `reviewer_${reviewer.id}_last_score`;
    const qaKey = `reviewer_${reviewer.id}_qa`;

    const savedScore = await AsyncStorage.getItem(scoreKey);
    const savedQA = await AsyncStorage.getItem(qaKey);

    const parsedQA = savedQA ? JSON.parse(savedQA) : [];

    setLastScore(savedScore ? JSON.parse(savedScore) : null);
    setTotalQuestions(parsedQA.length);
    setQnas(parsedQA);
  };

  /* =========================
     🔊 TEXT TO SPEECH
     ========================= */
  const stopTTS = () => {
    Speech.stop();
    setIsPlaying(false);
    currentIndexRef.current = 0;
  };

  const playNext = () => {
    if (currentIndexRef.current >= qnas.length) {
      stopTTS();
      return;
    }

    const item = qnas[currentIndexRef.current];

    Speech.speak(`Question. ${item.question}`, {
      onDone: () => {
        Speech.speak(`Answer. ${item.answer}`, {
          onDone: () => {
            currentIndexRef.current += 1;
            playNext();
          },
        });
      },
    });
  };

  const toggleTTS = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlaying) {
      stopTTS();
    } else {
      if (qnas.length === 0) return;
      setIsPlaying(true);
      currentIndexRef.current = 0;
      playNext();
    }
  };

  const isLowScore =
    lastScore &&
    lastScore.total > 0 &&
    lastScore.correct <= lastScore.total / 2;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          />

          <Text variant="headlineMedium" style={styles.title}>
            {reviewer.title}
          </Text>

          <IconButton
            icon={isPlaying ? "stop-circle" : "play-circle"}
            size={36}
            iconColor={isPlaying ? "#e53935" : "#4caf50"}
            disabled={qnas.length === 0}
            onPress={toggleTTS}
          />
        </View>

        {/* SCORE */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Previous score</Text>

          {lastScore ? (
            <>
              <Text
                style={[
                  styles.bigScore,
                  isLowScore && styles.lowScore,
                ]}
              >
                {lastScore.correct}
              </Text>

              <Text style={styles.scoreSub}>
                over {totalQuestions} items
              </Text>
            </>
          ) : (
            <Text style={styles.noScoreText}>
              No quiz taken yet
            </Text>
          )}
        </View>

        <Button
          mode="outlined"
          icon="clipboard-check-outline"
          style={styles.button}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Quiz", { reviewer });
          }}
        >
          Take Quiz
        </Button>

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="book-open-page-variant"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("QnA", { reviewer });
            }}
          >
            Q & A
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  title: {
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },

  scoreContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },

  scoreLabel: {
    opacity: 0.6,
    marginBottom: 6,
    fontSize: 20
  },

  bigScore: {
    fontSize: 50,
    fontWeight: "800",
    color: "#2e7d32",
  },

  lowScore: {
    color: "#d32f2f",
  },

  scoreSub: {
    marginTop: 4,
    opacity: 0.6,
  },

  noScoreText: {
    opacity: 0.6,
    fontStyle: "italic",
  },

  button: {
    borderRadius: 14,
  },

  info: {
    marginTop: 24,
    textAlign: "center",
    opacity: 0.6,
  },
});
