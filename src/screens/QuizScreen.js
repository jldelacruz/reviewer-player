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
import * as Speech from "expo-speech";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
  SHUFFLE: "quiz_shuffle",
  TTS_ENABLED: "tts_enabled",
  TTS_RATE: "tts_rate",
};

export default function QuizScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const QA_KEY = `reviewer_${reviewer.id}_qa`;
  const SCORE_KEY = `reviewer_${reviewer.id}_last_score`;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState([]);

  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState("normal");

  const correctSound = useRef(null);
  const wrongSound = useRef(null);

  const current = questions[currentIndex];

  /* =====================
     INIT
     ===================== */
  useEffect(() => {
    loadSettings();
    loadSounds();

    return () => {
      unloadSounds();
      Speech.stop();
    };
  }, []);

  /* =====================
     SETTINGS
     ===================== */
  const loadSettings = async () => {
    const values = await AsyncStorage.multiGet([
      SETTINGS_KEYS.HAPTICS,
      SETTINGS_KEYS.SHUFFLE,
      SETTINGS_KEYS.TTS_ENABLED,
      SETTINGS_KEYS.TTS_RATE,
    ]);

    let shuffle = true;

    values.forEach(([key, value]) => {
      if (value === null) return;

      if (key === SETTINGS_KEYS.HAPTICS)
        setHapticsEnabled(value !== "false");

      if (key === SETTINGS_KEYS.SHUFFLE) {
        shuffle = value !== "false";
        setShuffleEnabled(shuffle);
      }

      if (key === SETTINGS_KEYS.TTS_ENABLED)
        setTtsEnabled(value !== "false");

      if (key === SETTINGS_KEYS.TTS_RATE)
        setTtsRate(value);
    });

    await loadQuestions(shuffle);
  };

  const loadQuestions = async (shouldShuffle) => {
    const saved = await AsyncStorage.getItem(QA_KEY);
    if (!saved) return setQuestions([]);

    let parsed = JSON.parse(saved);
    if (shouldShuffle)
      parsed = [...parsed].sort(() => Math.random() - 0.5);

    setQuestions(parsed);
  };

  /* =====================
     BUILD CHOICES
     ===================== */
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

  /* =====================
     TTS
     ===================== */
  const getSpeechRate = () =>
    ttsRate === "slow" ? 0.75 : ttsRate === "fast" ? 1.15 : 0.95;

  useEffect(() => {
    if (!current || !ttsEnabled) return;

    Speech.stop();
    const t = setTimeout(() => {
      Speech.speak(current.question, { rate: getSpeechRate() });
    }, 150);

    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [current, ttsEnabled, ttsRate]);

  /* =====================
     HAPTICS
     ===================== */
  const impact = async (style) => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(style);
  };

  const notify = async (type) => {
    if (!hapticsEnabled) return;
    await Haptics.notificationAsync(type);
  };

  /* =====================
     SOUNDS
     ===================== */
  const loadSounds = async () => {
    correctSound.current = (
      await Audio.Sound.createAsync(
        require("../assets/sounds/correct.mp3")
      )
    ).sound;

    wrongSound.current = (
      await Audio.Sound.createAsync(
        require("../assets/sounds/wrong.mp3")
      )
    ).sound;
  };

  const unloadSounds = async () => {
    correctSound.current?.unloadAsync();
    wrongSound.current?.unloadAsync();
  };

  /* =====================
     ANSWER FLOW
     ===================== */
  const selectAnswer = async (choice) => {
    if (submitted) return;
    await impact(Haptics.ImpactFeedbackStyle.Light);
    setSelected(choice);
  };

  const submitAnswer = async () => {
    if (!selected || submitted) return;

    setSubmitted(true);
    Speech.stop();

    if (selected === current.answer) {
      setCorrectCount((c) => c + 1);
      await correctSound.current?.replayAsync();
      await notify(Haptics.NotificationFeedbackType.Success);
    } else {
      await wrongSound.current?.replayAsync();
      await notify(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = async () => {
    await impact(Haptics.ImpactFeedbackStyle.Light);

    setSelected(null);
    setSubmitted(false);

    if (currentIndex + 1 >= questions.length) {
      await AsyncStorage.setItem(
        SCORE_KEY,
        JSON.stringify({
          correct: correctCount,
          total: questions.length,
        })
      );

      navigation.replace("QuizSummary", {
        correct: correctCount,
        total: questions.length,
        reviewer,
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  /* =====================
     UI
     ===================== */
  const progress =
    questions.length > 0
      ? (currentIndex + 1) / questions.length
      : 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.title}>
            {reviewer.title} Quiz
          </Text>
          <IconButton
            icon={ttsEnabled ? "volume-high" : "volume-off"}
            onPress={() => setTtsEnabled(!ttsEnabled)}
          />
        </View>

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
                      isSelected && !submitted && styles.selected,
                      submitted && isCorrect && styles.correct,
                      submitted && isSelected && !isCorrect && styles.wrong,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionText}>{choice}</Text>

                      {submitted && isCorrect && (
                        <Icon source="check-circle" size={22} color="#2e7d32" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <Icon source="close-circle" size={22} color="#d32f2f" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* ACTION BUTTON */}
            {!submitted && (
              <View style={styles.bottomAction}>
                <Button mode="contained" 
                icon='check'
                onPress={submitAnswer} 
                disabled={!selected} 
                contentStyle={{ paddingVertical: 8 }}>
                  Submit
                </Button>
              </View>
            )}

            {submitted && (
              <View style={styles.bottomAction}>
                <Button 
                  icon={currentIndex + 1 === questions.length ? "check" : "arrow-right"}
                  mode="contained" 
                  onPress={nextQuestion}
                  contentStyle={{ paddingVertical: 8 }}>
                  {currentIndex + 1 === questions.length ? "Finish" : "Next"}
                </Button>
              </View>
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
  container: { flex: 1, padding: 20, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", height: 56 },
  title: { flex: 1, fontWeight: "700", textAlign: "center" },
  progress: { height: 6, borderRadius: 6 },
  progressText: { fontSize: 12, opacity: 0.5, marginTop: 6 },
  question: { fontSize: 22, fontWeight: "700", marginTop: 20 },
  options: { marginTop: 24, gap: 12 },
  option: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: { fontSize: 16, fontWeight: "500" },
  selected: { borderColor: "#4A90E2", backgroundColor: "#F5F3FF" },
  correct: { borderColor: "#2e7d32", backgroundColor: "#E8F5E9" },
  wrong: { borderColor: "#d32f2f", backgroundColor: "#FDECEA" },
  bottomAction: { marginTop: "auto", paddingTop: 16 },
});
