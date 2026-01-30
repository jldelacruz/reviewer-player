import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import EmptyReviewers from "../components/EmptyReviewers";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
};

export default function HomeScreen({ navigation }) {
  const [reviewers, setReviewers] = useState([]);
  const [totalQnA, setTotalQnA] = useState(0);
  const [lastScore, setLastScore] = useState(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  /* =====================
     🔄 REFRESH ON FOCUS
     ===================== */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await loadSettings();
      await loadData();
      triggerSelection();
    });

    return unsubscribe;
  }, [navigation]);

  /* =====================
     ⚙️ LOAD SETTINGS
     ===================== */
  const loadSettings = async () => {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS);
    if (value !== null) {
      setHapticsEnabled(value === "true");
    }
  };

  /* =====================
     📦 LOAD DATA
     ===================== */
  const loadData = async () => {
    const storedReviewers = await AsyncStorage.getItem("reviewers");
    const parsedReviewers = storedReviewers
      ? JSON.parse(storedReviewers)
      : [];

    setReviewers(parsedReviewers);

    let qnaCount = 0;
    let recentScore = null;

    for (const reviewer of parsedReviewers) {
      const qnaKey = `reviewer_${reviewer.id}_qa`;
      const scoreKey = `reviewer_${reviewer.id}_last_score`;

      const qnas = await AsyncStorage.getItem(qnaKey);
      const score = await AsyncStorage.getItem(scoreKey);

      if (qnas) qnaCount += JSON.parse(qnas).length;
      if (score && !recentScore) {
        recentScore = JSON.parse(score);
      }
    }

    setTotalQnA(qnaCount);
    setLastScore(recentScore);
  };

  /* =====================
     📳 HAPTIC HELPERS
     ===================== */
  const triggerSelection = async () => {
    if (hapticsEnabled) {
      await Haptics.selectionAsync();
    }
  };

  const triggerLightImpact = async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const triggerMediumImpact = async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const scorePercent =
    lastScore && lastScore.total > 0
      ? lastScore.correct / lastScore.total
      : 0;

  /* =====================
     🎴 RENDER REVIEWER
     ===================== */
  const renderReviewer = ({ item }) => (
    <Card
      style={styles.reviewerCard}
      onPress={async () => {
        await triggerLightImpact();
        navigation.navigate("ReviewerDetails", { reviewer: item });
      }}
    >
      <Card.Content style={styles.reviewerContent}>
        <View>
          <Text style={styles.reviewerTitle}>{item.title}</Text>
          <Text style={styles.reviewerSub}>Tap to continue</Text>
        </View>
        <IconButton icon="chevron-right" />
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        {/* GREETING */}
        <Text variant="headlineMedium" style={styles.greeting}>
          Ready to review? 📚
        </Text>
        <Text style={styles.subtitle}>
          Keep your knowledge fresh today
        </Text>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{reviewers.length}</Text>
            <Text style={styles.statLabel}>Reviewers</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{totalQnA}</Text>
            <Text style={styles.statLabel}>Q&A</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>
              {lastScore ? `${Math.round(scorePercent * 100)}%` : "—"}
            </Text>
            <Text style={styles.statLabel}>Last Score</Text>
          </Card>
        </View>

        {/* PRIMARY CTA */}
        <Button
          mode="contained"
          icon="play-circle"
          style={styles.cta}
          onPress={async () => {
            await triggerMediumImpact();
            navigation.navigate("Reviewers");
          }}
        >
          Start Reviewing
        </Button>

        {/* RECENT */}
        <Text style={styles.sectionTitle}>Your Reviewers</Text>

        <FlatList
          data={reviewers.slice(0, 3)}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewer}
          ListEmptyComponent={<EmptyReviewers />}
          contentContainerStyle={{
            paddingBottom: 16,
            paddingHorizontal: 1,
          }}
        />

        {/* PREMIUM HINT */}
        <Card
          style={styles.premiumCard}
          onPress={triggerMediumImpact}
        >
          <Text style={styles.premiumTitle}>
            Unlock Smarter Studying 🚀
          </Text>
          <Text style={styles.premiumText}>
            Unlimited reviewers, advanced quizzes, and future
            AI-powered tools.
          </Text>
        </Card>
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
    backgroundColor: "#f6f7fb",
  },
  greeting: { fontWeight: "700" },
  subtitle: { opacity: 0.6, marginBottom: 24 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    alignItems: "center",
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statNumber: { fontSize: 22, fontWeight: "700" },
  statLabel: { opacity: 0.6, marginTop: 4 },
  cta: {
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 16,
  },
  reviewerCard: {
    marginBottom: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  reviewerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerTitle: { fontWeight: "600" },
  reviewerSub: { opacity: 0.5, fontSize: 12 },
  premiumCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f1f3ff",
  },
  premiumTitle: { fontWeight: "700", marginBottom: 6 },
  premiumText: { opacity: 0.7 },
});
