import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function QuizSummaryScreen({ route, navigation }) {
  const { correct, total, reviewer } = route.params;

  const rawPercentage = correct / total;
  const percentage = Math.round(rawPercentage * 100);

  const passed =
    total < 5
      ? correct >= total - 1
      : rawPercentage >= 0.7;

  const handleRetry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("Quiz", { reviewer });
  };

  const handleDone = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* RESULT ICON */}
        <View
          style={[
            styles.iconWrap,
            passed ? styles.passBg : styles.failBg,
          ]}
        >
          <Icon
            source={passed ? "check-circle" : "close-circle"}
            size={100}
            color={passed ? "#2E7D32" : "#C62828"}
          />
        </View>

        {/* RESULT TEXT */}
        <Text style={styles.title}>
          {passed ? "You Passed 🎉" : "You Failed"}
        </Text>

        <Text style={styles.subtitle}>
          {passed
            ? "Great job! You’re ready to move forward."
            : "Don’t worry — review and try again."}
        </Text>

        {/* SCORE CARD */}
        <Card style={styles.scoreCard}>
          <Card.Content style={styles.scoreContent}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreNumber}>{correct}</Text>
              <Text style={styles.scoreLabel}>Correct</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.scoreBlock}>
              <Text style={styles.scoreNumber}>{total}</Text>
              <Text style={styles.scoreLabel}>Total</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.scoreBlock}>
              <Text style={styles.scoreNumber}>{percentage}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </Card.Content>
        </Card>

        {/* ACTIONS */}
        <View style={styles.actions}>
          {!passed && (
            <Button
              icon='refresh'
              mode="outlined"
              onPress={handleRetry}
              style={styles.retryBtn}
            >
              Retry
            </Button>
          )}

          <Button
            icon='check'
            mode="contained"
            onPress={handleDone}
            style={styles.doneBtn}
          >
            Done
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF"
  },

  iconWrap: {
    width: 130,
    height: 130,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  passBg: {
    backgroundColor: "#E8F5E9",
  },

  failBg: {
    backgroundColor: "#FDECEA",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
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
    marginBottom: 32,
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

  actions: {
    width: "100%",
    gap: 12,
  },

  retryBtn: {
    borderRadius: 16,
  },

  doneBtn: {
    borderRadius: 16,
    paddingVertical: 6,
  },
});