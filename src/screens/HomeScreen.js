import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const [reviewers, setReviewers] = useState([]);
  const [totalQnA, setTotalQnA] = useState(0);
  const [lastScore, setLastScore] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

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
      if (score && !recentScore)
        recentScore = JSON.parse(score);
    }

    setTotalQnA(qnaCount);
    setLastScore(recentScore);
  };

  const scorePercent =
    lastScore && lastScore.total > 0
      ? lastScore.correct / lastScore.total
      : 0;

  /* =====================
     🎴 RENDER RECENT ITEM
     ===================== */

  const renderReviewer = ({ item }) => (
    <Card
      style={styles.reviewerCard}
      onPress={() =>
        navigation.navigate("ReviewerDetails", { reviewer: item })
      }
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
    <SafeAreaView style={{ flex: 1 }}>
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
            <Text style={styles.statNumber}>
              {reviewers.length}
            </Text>
            <Text style={styles.statLabel}>Reviewers</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{totalQnA}</Text>
            <Text style={styles.statLabel}>Q&A</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>
              {lastScore
                ? `${Math.round(scorePercent * 100)}%`
                : "—"}
            </Text>
            <Text style={styles.statLabel}>Last Score</Text>
          </Card>
        </View>

        {/* PRIMARY CTA */}
        <Button
          mode="contained"
          icon="play-circle"
          style={styles.cta}
          onPress={() => navigation.navigate("Reviewers")}
        >
          Start Reviewing
        </Button>

        {/* RECENT */}
        <Text style={styles.sectionTitle}>Your Reviewers</Text>

        <FlatList
          data={reviewers.slice(0, 3)}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewer}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Create your first reviewer to get started
            </Text>
          }
        />

        {/* PREMIUM HINT */}
        <Card style={styles.premiumCard}>
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
  },

  greeting: {
    fontWeight: "700",
  },

  subtitle: {
    opacity: 0.6,
    marginBottom: 24,
  },

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
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
  },

  statLabel: {
    opacity: 0.6,
    marginTop: 4,
  },

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
    marginBottom: 10,
    borderRadius: 12,
  },

  reviewerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reviewerTitle: {
    fontWeight: "600",
  },

  reviewerSub: {
    opacity: 0.5,
    fontSize: 12,
  },

  empty: {
    opacity: 0.5,
    textAlign: "center",
    marginTop: 20,
  },

  premiumCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f1f3ff",
  },

  premiumTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  premiumText: {
    opacity: 0.7,
  },
});
