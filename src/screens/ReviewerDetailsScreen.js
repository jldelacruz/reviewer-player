import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Button,
  Card,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";

export default function ReviewerDetailsScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const [lastScore, setLastScore] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [qnas, setQnas] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentIndexRef = useRef(0);

  useEffect(() => {
    loadStats();

    return () => {
      Speech.stop(); // 🛑 stop when leaving screen
    };
  }, []);

  const loadStats = async () => {
    try {
      const scoreKey = `reviewer_${reviewer.id}_last_score`;
      const qaKey = `reviewer_${reviewer.id}_qa`;

      const savedScore = await AsyncStorage.getItem(scoreKey);
      const savedQA = await AsyncStorage.getItem(qaKey);

      const parsedQA = savedQA ? JSON.parse(savedQA) : [];

      setLastScore(savedScore ? JSON.parse(savedScore) : null);
      setTotalQuestions(parsedQA.length);
      setQnas(parsedQA);
    } catch (e) {
      console.log("Load stats error", e);
    }
  };

  /* =========================
     🔊 TEXT TO SPEECH LOGIC
     ========================= */

  const stopTTS = () => {
    Speech.stop();
    setIsPlaying(false);
    currentIndexRef.current = 0;
  };

  const playNext = () => {
    if (currentIndexRef.current >= qnas.length) {
      stopTTS(); // ✅ auto stop when done
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

  const toggleTTS = () => {
    if (isPlaying) {
      stopTTS();
    } else {
      if (qnas.length === 0) return;

      setIsPlaying(true);
      currentIndexRef.current = 0;
      playNext();
    }
  };

  const scorePercent =
    lastScore && lastScore.total > 0
      ? lastScore.correct / lastScore.total
      : 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />

          <Text variant="headlineMedium" style={styles.title}>
            {reviewer.title}
          </Text>

          <IconButton
            icon={isPlaying ? "stop-circle" : "play-circle"}
            size={35}
            iconColor={isPlaying ? "#e53935" : "#4caf50"}
            disabled={qnas.length === 0}
            onPress={toggleTTS}
          />
        </View>

        {/* SCORE CARD */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Last Quiz Result
            </Text>

            {lastScore ? (
              <>
                <Text style={styles.scoreText}>
                  {lastScore.correct} / {lastScore.total} correct
                </Text>

                <ProgressBar
                  progress={scorePercent}
                  style={styles.progress}
                />

                <Text style={styles.percentText}>
                  {Math.round(scorePercent * 100)}%
                </Text>
              </>
            ) : (
              <Text style={styles.noScoreText}>
                No quiz taken yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="book-open-page-variant"
            onPress={() =>
              navigation.navigate("QnA", { reviewer })
            }
            style={styles.button}
          >
            Q & A
          </Button>

          <Button
            mode="outlined"
            icon="clipboard-check-outline"
            onPress={() =>
              navigation.navigate("Quiz", { reviewer })
            }
            style={styles.button}
          >
            Take Quiz
          </Button>
        </View>

        {/* INFO */}
        <Text style={styles.info}>
          {totalQuestions} total questions
        </Text>
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
    marginBottom: 20,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  progress: {
    height: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  percentText: {
    textAlign: "right",
    fontWeight: "600",
    opacity: 0.7,
  },
  noScoreText: {
    opacity: 0.6,
    fontStyle: "italic",
  },
  actions: {
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
  info: {
    marginTop: 24,
    textAlign: "center",
    opacity: 0.6,
  },
});
