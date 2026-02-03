import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import {
  Text,
  Button,
  ProgressBar,
  IconButton,
  Icon,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyQnA from "../components/EmptyQnA";
import { parse } from "react-native-svg";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
  SHUFFLE: "quiz_shuffle", // 🔄 SHUFFLE
};

export default function QuizScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const QA_KEY = `reviewer_${reviewer.id}_qa`;
  const SCORE_KEY = `reviewer_${reviewer.id}_last_score`;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [choices, setChoices] = useState([]);

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(true); // 🔄 SHUFFLE

  const correctSound = useRef(null);
  const wrongSound = useRef(null);

  /* =====================
     INIT
     ===================== */
  useEffect(() => {
    loadSettings();
    loadSounds();

    return () => {
      unloadSounds();
    };
  }, []);

  /* =====================
     LOAD SETTINGS
     ===================== */
  const loadSettings = async () => {
    const values = await AsyncStorage.multiGet([
      SETTINGS_KEYS.HAPTICS,
      SETTINGS_KEYS.SHUFFLE,
    ]);

    let haptics = true;
    let shuffle = true;

    values.forEach(([key, value]) => {
      if (value === null) return;

      if (key === SETTINGS_KEYS.HAPTICS) {
        haptics = value !== "false";
        setHapticsEnabled(haptics);
      }

      if (key === SETTINGS_KEYS.SHUFFLE) {
        shuffle = value !== "false";
        setShuffleEnabled(shuffle);
      }
    });

    // 🔥 PASS THE ACTUAL VALUE
    await loadQuestions(shuffle);
  };


  /* =====================
     LOAD QUESTIONS
     ===================== */
  const loadQuestions = async (shouldShuffle) => {
    const saved = await AsyncStorage.getItem(QA_KEY);
    if (!saved) {
      setQuestions([]);
      return;
    }

    let parsed = JSON.parse(saved);

    if (shouldShuffle) {
      parsed = [...parsed].sort(() => Math.random() - 0.5);
    }

    setQuestions(parsed);
  };

  /* =====================
     BUILD CHOICES
     ===================== */
  const current = questions[currentIndex];

  useEffect(() => {
    if (!current) return;

    const correct = current.answer;
    const others = questions
      .filter((q) => q.answer !== correct)
      .map((q) => q.answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    setChoices([...others, correct].sort(() => Math.random() - 0.5));
  }, [currentIndex, questions]);

  const progress =
    questions.length > 0
      ? (currentIndex + 1) / questions.length
      : 0;

  /* =====================
     HAPTICS
     ===================== */
  const hapticImpact = async (style) => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(style);
  };

  const hapticNotify = async (type) => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(type);
  };

  /* =====================
     SOUNDS
     ===================== */
  const loadSounds = async () => {
    const correct = await Audio.Sound.createAsync(
      require("../assets/sounds/correct.mp3")
    );
    const wrong = await Audio.Sound.createAsync(
      require("../assets/sounds/wrong.mp3")
    );

    correctSound.current = correct.sound;
    wrongSound.current = wrong.sound;
  };

  const unloadSounds = async () => {
    if (correctSound.current) await correctSound.current.unloadAsync();
    if (wrongSound.current) await wrongSound.current.unloadAsync();
  };

  /* =====================
     ANSWER SELECT
     ===================== */
  const selectAnswer = async (choice) => {
    if (showAnswer) return;

    setSelected(choice);
    setShowAnswer(true);

    if (choice === current.answer) {
      await correctSound.current?.replayAsync();
      await hapticNotify(Haptics.NotificationFeedbackType.Success);
      setCorrectCount((prev) => prev + 1);
    } else {
      await wrongSound.current?.replayAsync();
      await hapticNotify(Haptics.NotificationFeedbackType.Error);
    }
  };

  /* =====================
     NEXT
     ===================== */
  const nextQuestion = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Light);

    setSelected(null);
    setShowAnswer(false);

    if (currentIndex + 1 >= questions.length) {
      await AsyncStorage.setItem(
        SCORE_KEY,
        JSON.stringify({
          correct: correctCount,
          total: questions.length,
        })
      );

      await AsyncStorage.setItem(
        `reviewer_${reviewer.id}_last_studied`,
        Date.now().toString()
      );

      navigation.replace("QuizSummary", {
        correct: correctCount,
        total: questions.length,
        reviewer,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text>{shuffleEnabled ? 'yes' : 'no'}</Text>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={async () => {
              await hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          />
          <Text variant="headlineSmall" style={styles.title}>
            {reviewer.title} Quiz
          </Text>
        </View>

        {questions.length === 0 && <EmptyQnA onPress={() => {}} />}

        {questions.length > 0 && (
          <>
            <ProgressBar progress={progress} style={styles.progress} />
            <Text style={styles.progressText}>
              Question {currentIndex + 1} of {questions.length}
            </Text>

            <Text style={styles.question}>{current.question}</Text>

            <View style={styles.options}>
              {choices.map((choice) => {
                const isCorrect = choice === current.answer;
                const isSelected = choice === selected;

                return (
                  <Pressable
                    key={choice}
                    onPress={() => selectAnswer(choice)}
                    style={[
                      styles.option,
                      isSelected && !showAnswer && styles.selected,
                      showAnswer && isCorrect && styles.correct,
                      showAnswer &&
                        isSelected &&
                        !isCorrect &&
                        styles.wrong,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionText}>{choice}</Text>

                      {showAnswer && isCorrect && (
                        <Icon source="check-circle" size={22} color="#2e7d32" />
                      )}
                      {showAnswer && isSelected && !isCorrect && (
                        <Icon source="close-circle" size={22} color="#d32f2f" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {showAnswer && (
              <Button
                mode="contained"
                onPress={nextQuestion}
                style={styles.nextBtn}
                contentStyle={{ paddingVertical: 10 }}
              >
                {currentIndex + 1 === questions.length ? "Finish" : "Next"}
              </Button>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* =====================
   STYLES
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
    gap: 8,
    marginBottom: 12,
  },

  title: {
    fontWeight: "700",
  },

  progress: {
    height: 6,
    borderRadius: 6,
  },

  progressText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 6,
  },

  question: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    marginTop: 20,
  },

  options: {
    marginTop: 24,
    gap: 12,
  },

  option: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },

  selected: {
    borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },

  correct: {
    borderColor: "#2e7d32",
    backgroundColor: "#E8F5E9",
  },

  wrong: {
    borderColor: "#d32f2f",
    backgroundColor: "#FDECEA",
  },

  nextBtn: {
    marginTop: 28,
    borderRadius: 16,
  },
});
