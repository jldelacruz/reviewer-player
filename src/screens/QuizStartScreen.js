import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Icon, IconButton } from "react-native-paper";
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

  const loadSettings = async () => {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS);
    if (value !== null) {
      setHapticsEnabled(value === "true");
    }
  };

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

  const hapticImpact = async (style) => {
    if (!hapticsEnabled) return;
    await Haptics.impactAsync(style);
  };

  const passScore =
    total < 5 ? total - 1 : Math.ceil(total * 0.7);

  const startQuiz = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Quiz", { reviewer });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
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

          <View style={{ width: 40 }} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Icon source="list-status" size={96} color="#4A90E2" />
          </View>

          <Text style={styles.headline}>Ready for the quiz?</Text>

          <Text style={styles.subtitle}>
            This quiz helps you check how well you remember the material.
          </Text>

          {lastScore && (
            <Text style={styles.lastScore}>
              You previously got{" "}
              <Text style={styles.bold}>
                {lastScore.correct} over {lastScore.total}
              </Text>{" "}
              score.
            </Text>
          )}

          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {total} questions • Passing score: {passScore}
            </Text>
          </View>
        </View>

        {/* ACTION */}
        <View style={styles.actions}>
          <Button
            icon="play"
            mode="contained"
            onPress={startQuiz}
            style={styles.startBtn}
            contentStyle={{ paddingVertical: 8 }}
          >
            Start Quiz
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
    height: 56,
  },

  title: {
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  headline: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 26,
    paddingHorizontal: 24,
  },

  lastScore: {
    fontSize: 15,
    opacity: 0.75,
    marginBottom: 12,
    textAlign: "center",
  },

  bold: {
    fontWeight: "800",
    opacity: 1,
  },

  meta: {
    marginTop: 8,
  },

  metaText: {
    fontSize: 13,
    opacity: 0.5,
  },

  actions: {
    // marginBottom: 12,
  },

  startBtn: {
    borderRadius: 16,
  },
});
