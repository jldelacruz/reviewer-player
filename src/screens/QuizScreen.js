import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Card,
  Button,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const QA_KEY = `reviewer_${reviewer.id}_qa`;
  const SCORE_KEY = `reviewer_${reviewer.id}_last_score`;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const saved = await AsyncStorage.getItem(QA_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    const shuffled = [...parsed].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  };

  const current = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  const generateChoices = () => {
    if (!current) return [];

    const correct = current.answer;
    const others = questions
      .filter((q) => q.answer !== correct)
      .map((q) => q.answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [...others, correct].sort(() => Math.random() - 0.5);
  };

  const choices = generateChoices();

  const selectAnswer = async (choice) => {
    if (showAnswer) return;

    setSelected(choice);

    // ⏱ tiny delay = intentional UX
    setTimeout(() => {
      setShowAnswer(true);

      if (choice === current.answer) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        setCorrectCount((prev) => prev + 1);
      } else {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      }
    }, 200);
  };

  const nextQuestion = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      navigation.goBack();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!current) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No questions available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <ProgressBar progress={progress} style={styles.progress} />
            <Text style={styles.progressText}>
              {currentIndex + 1} / {questions.length}
            </Text>
          </View>
        </View>

        {/* QUESTION */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.questionLabel}>Question</Text>
            <Text style={styles.question}>{current.question}</Text>
          </Card.Content>
        </Card>

        {/* OPTIONS */}
        <View style={styles.options}>
          {choices.map((choice, index) => {
            const isCorrect = choice === current.answer;
            const isSelected = choice === selected;

            let mode = "outlined";
            let icon = "circle-outline";

            if (showAnswer) {
              if (isCorrect) {
                mode = "contained";
                icon = "check-circle";
              } else if (isSelected) {
                mode = "contained";
                icon = "close-circle";
              }
            }

            return (
              <Button
                key={index}
                mode={mode}
                icon={icon}
                onPress={() => selectAnswer(choice)}
                style={[
                  styles.option,
                  showAnswer && isCorrect && styles.correct,
                  showAnswer && isSelected && !isCorrect && styles.wrong,
                ]}
              >
                {choice}
              </Button>
            );
          })}
        </View>

        {/* NEXT */}
        {showAnswer && (
          <Button
            mode="contained"
            icon="arrow-right"
            onPress={nextQuestion}
            style={styles.nextBtn}
          >
            {currentIndex + 1 === questions.length
              ? "Finish Quiz"
              : "Next"}
          </Button>
        )}
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
    padding: 16,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  progress: {
    height: 8,
    borderRadius: 6,
  },

  progressText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
    textAlign: "right",
  },

  card: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 8,
  },

  questionLabel: {
    opacity: 0.5,
    marginBottom: 6,
  },

  question: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },

  options: {
    marginTop: 28,
    gap: 12,
  },

  option: {
    borderRadius: 14,
    paddingVertical: 6,
  },

  correct: {
    backgroundColor: "#E8F5E9",
  },

  wrong: {
    backgroundColor: "#FDECEA",
  },

  nextBtn: {
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 6,
  },
});