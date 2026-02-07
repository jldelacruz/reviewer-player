import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, Icon, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
};

export default function QuizStartScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const SCORE_KEY = `reviewer_${reviewer.id}_last_score`;
  const QA_KEY = `reviewer_${reviewer.id}_qa`;

  const [lastScore, setLastScore] = useState(null);
  const [total, setTotal] = useState(0);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  /* =====================
     LOAD SETTINGS
     ===================== */
  const loadSettings = async () => {
    const value = await AsyncStorage.getItem(
      SETTINGS_KEYS.HAPTICS
    );
    if (value !== null) {
      setHapticsEnabled(value === "true");
    }
  };

  /* =====================
     LOAD QUIZ DATA
     ===================== */
  const loadData = async () => {
    const score = await AsyncStorage.getItem(SCORE_KEY);
    const qna = await AsyncStorage.getItem(QA_KEY);

    if (score) {
      setLastScore(JSON.parse(score));
    }

    if (qna) {
      setTotal(JSON.parse(qna).length);
    }
  };

  /* =====================
     HAPTICS (SAFE)
     ===================== */
  const hapticImpact = async (style) => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(style);
  };

  const passScore =
    total < 5 ? total - 1 : Math.ceil(total * 0.7);

  const startQuiz = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("Quiz", { reviewer });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={async () => {
              await hapticImpact(
                Haptics.ImpactFeedbackStyle.Light
              );
              navigation.goBack();
            }}
          />
        </View>

        <View style={styles.summaryContainer}>
          {/* ICON */}
          <View style={styles.iconWrap}>
            <Icon
              source="clipboard-text-outline"
              size={90}
              color="#4A90E2"
            />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            {reviewer.title} Quiz
          </Text>

          <Text style={styles.subtitle}>
            Test what you’ve learned before moving on
          </Text>

          {/* LAST SCORE */}
          {lastScore && (
            <Card style={styles.scoreCard}>
              <Card.Content style={styles.scoreContent}>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreNumber}>
                    {lastScore.correct}
                  </Text>
                  <Text style={styles.scoreLabel}>
                    Correct
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreNumber}>
                    {lastScore.total}
                  </Text>
                  <Text style={styles.scoreLabel}>
                    Total
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* INFO */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoText}>
                This quiz contains{" "}
                <Text style={styles.bold}>{total}</Text>{" "}
                questions.
              </Text>

              <Text style={styles.infoText}>
                You need at least{" "}
                <Text style={styles.bold}>
                  {passScore}
                </Text>{" "}
                correct answers to pass.
              </Text>
            </Card.Content>
          </Card>

          {/* ACTION */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={startQuiz}
              style={styles.startBtn}
              contentStyle={{ paddingVertical: 8 }}
            >
              Start Quiz
            </Button>
          </View>
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

  summaryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrap: {
    width: 130,
    height: 130,
    borderRadius: 80,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 28,
  },

  scoreCard: {
    width: "100%",
    borderRadius: 18,
    marginBottom: 16,
    elevation: 4,
  },

  scoreContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scoreBlock: {
    flex: 1,
    alignItems: "center",
  },

  scoreNumber: {
    fontSize: 22,
    fontWeight: "800",
  },

  scoreLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#E0E0E0",
  },

  infoCard: {
    width: "100%",
    borderRadius: 16,
    marginBottom: 32,
    elevation: 2,
  },

  infoText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
    textAlign: "center",
  },

  bold: {
    fontWeight: "700",
    opacity: 1,
  },

  actions: {
    width: "100%",
  },

  startBtn: {
    borderRadius: 16,
  },
});
