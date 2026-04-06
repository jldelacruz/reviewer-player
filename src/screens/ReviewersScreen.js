import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import {
  Text,
  FAB,
  Card,
  TextInput,
  Button,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import EmptyReviewers from "../components/EmptyReviewers";

import Purchases from "react-native-purchases";

const STORAGE_KEY = "reviewers";
const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
  TRIAL_DAYS: 7,
};

export default function ReviewersScreen({ navigation }) {
  const [reviewers, setReviewers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [editingReviewer, setEditingReviewer] = useState(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isProUser, setIsProUser] = useState(false);

  /* =====================
     🔄 LOAD ON FOCUS
     ===================== */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await loadSettings();
      await loadReviewers();
      await loadPremiumStatus();
    });

    return unsubscribe;
  }, [navigation]);

  // const loadPremiumStatus = async () => {
  //   const subscribed = await AsyncStorage.getItem("is_subscribed");
  //   const isTrialActive = await checkTrialActive();

  //   const premium = subscribed === "true" || isTrialActive;

  //   setIsProUser(premium);
  // };

  const loadPremiumStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();

      const entitlement = customerInfo.entitlements.active["Recally AI Pro"];

      const premium = !!entitlement;

      setIsProUser(premium);

    } catch (e) {
      console.log("Error loading premium status:", e);
    }
  };

  /* =====================
     ⚙️ SETTINGS
     ===================== */
  const loadSettings = async () => {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS);
    if (value !== null) {
      setHapticsEnabled(value === "true");
    }
  };

  /* =====================
     📳 HAPTIC HELPERS
     ===================== */
  const lightImpact = async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const mediumImpact = async () => {
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const successNotification = async () => {
    if (hapticsEnabled) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    }
  };

  const warningNotification = async () => {
    if (hapticsEnabled) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    }
  };

  /* =====================
     📦 LOAD REVIEWERS
     ===================== */
  const loadReviewers = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setReviewers([]);
      return;
    }

    const reviewersList = JSON.parse(stored);

    const enriched = await Promise.all(
      reviewersList.map(async (reviewer) => {
        const QA_KEY = `reviewer_${reviewer.id}_qa`;
        const SCORE_KEY = `reviewer_${reviewer.id}_last_score`;
        const LAST_STUDIED_KEY = `reviewer_${reviewer.id}_last_studied`;

        const qnaStored = await AsyncStorage.getItem(QA_KEY);
        const scoreStored = await AsyncStorage.getItem(SCORE_KEY);
        const lastStudied = await AsyncStorage.getItem(LAST_STUDIED_KEY);

        const qnaList = qnaStored ? JSON.parse(qnaStored) : [];
        let quizStatus = "not_taken";
        let scoreText = null;

        if (scoreStored) {
          const { correct, total } = JSON.parse(scoreStored);

          const rawPercentage = correct / total;

          const passed =
            total < 5
              ? correct >= total - 1
              : rawPercentage >= 0.7;

          quizStatus = passed ? "passed" : "failed";
          scoreText = `${correct} / ${total}`;
        }

        return {
          ...reviewer,
          count: qnaList.length,
          lastStudied,
          quizStatus,
          scoreText,
        };
      })
    );

    // newest first
    enriched.sort((a, b) => b.createdAt - a.createdAt);

    setReviewers(enriched);
  };

  const saveReviewers = async (data) => {
    setReviewers(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /* =====================
     ➕ / ✏️ CREATE & EDIT
     ===================== */
  const openCreateModal = async () => {
    await mediumImpact();
    setEditingReviewer(null);
    setTitle("");
    setModalVisible(true);
  };

  const openEditModal = async (item) => {
    await lightImpact();
    setEditingReviewer(item);
    setTitle(item.title);
    setModalVisible(true);
  };

  const closeModal = async () => {
    await lightImpact();
    setModalVisible(false);
  };

  const saveReviewer = async () => {
    if (!title.trim()) return;

    if(!editingReviewer) {
      if (reviewers.filter(r => (r?.isSample ?? false) !== true).length >= 2 && !isProUser) {
        Alert.alert(
          "Limit reached",
          "Upgrade to Pro for unlimited reviewers.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => navigation.navigate("Paywall") }
          ]
        );
        return;
      }
    }

    const updated = editingReviewer
      ? reviewers.map((r) =>
          r.id === editingReviewer.id
            ? { ...r, title: title.trim() }
            : r
        )
      : [
          {
            id: uuid.v4(),
            title: title.trim(),
            createdAt: Date.now(),
          },
          ...reviewers,
        ];

    

    await saveReviewers(updated);
    await successNotification();

    setModalVisible(false);
    setTitle("");
    setEditingReviewer(null);
  };

  /* =====================
     🗑️ DELETE
     ===================== */
  const deleteReviewer = (item) => {
    Alert.alert(
      "Delete Reviewer",
      "This will remove the reviewer and all related Q&A. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await warningNotification();
            await saveReviewers(
              reviewers.filter((r) => r.id !== item.id)
            );
          },
        },
      ]
    );
  };

  /* =====================
     🏷️ STATUS BADGE
     ===================== */
  const StatusBadge = ({ status, score }) => {
    const map = {
      passed: { label: "Passed", bg: "#2E7D32", color: "#fff" },
      failed: { label: "Failed", bg: "#C62828", color: "#fff" },
      not_taken: { label: "Not taken", bg: "#bebfc2", color: "#fff" },
    };

    const s = map[status] || map["not_taken"];

    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.color }]}>
          {score ?? s.label}
        </Text>
      </View>
    );
  };

  /* =====================
     🎴 RENDER ITEM
     ===================== */
  const renderItem = ({ item }) => (
    <Swipeable
      containerStyle={styles.swipeContainer}
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
    >
      <View style={styles.cardWrapper}>
        <Card
          style={styles.card}
          onPress={async () => {
            await lightImpact();
            navigation.navigate("ReviewerDetails", { reviewer: item });
          }}
        >
          <Card.Content style={styles.reviewerContent}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.title}
              </Text>

              <Text style={styles.countText}>
                {item.count} Q&A
              </Text>

              {(item.isSample ?? false) && (
                <Text style={styles.lastStudiedText}>
                  Sample Reviewer
                </Text>
              )}

              {item.lastStudied && (!item.isSample ?? false) && (
                <Text style={styles.lastStudiedText}>
                  {formatLastStudied(item.lastStudied)}
                </Text>
              )}
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <StatusBadge
                status={item.quizStatus}
                score={item.scoreText}
              />
              <IconButton icon="chevron-right" />
            </View>
          </Card.Content>
        </Card>
      </View>
    </Swipeable>
  );

  const renderRightActions = (item) => (
    <View style={styles.swipeActions}>
      <IconButton
        disabled={item?.isSample ?? false}
        icon="pencil"
        iconColor="#1976d2"
        onPress={() => openEditModal(item)}
      />
      <IconButton
        icon="delete"
        iconColor="#d32f2f"
        onPress={() => deleteReviewer(item)}
        disabled={item?.isSample ?? false}
      />
    </View>
  );

  const formatLastStudied = (timestamp) => {
    const diffMs = Date.now() - Number(timestamp);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Last studied today";
    if (diffDays === 1) return "Last studied yesterday";
    return `Last studied ${diffDays} days ago`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            My Reviewers
          </Text>
        </View>

        <FlatList
          data={reviewers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 1,
            paddingBottom: 120,
            flexGrow: 1,
            marginTop: 24,
          }}
          ListEmptyComponent={
            <EmptyReviewers onPress={openCreateModal} />
          }
        />

        {reviewers.length > 0 && (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={openCreateModal}
            backgroundColor="#4A90E2"
            color="#FFF"
          />
        )}

        {/* MODAL */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <Pressable style={styles.overlay} onPress={closeModal} />
          <View style={styles.modal}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingReviewer ? "Edit Reviewer" : "Create Reviewer"}
            </Text>

            <TextInput
              label="Reviewer title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              autoFocus
            />

            <Button
              icon="check"
              mode="contained"
              onPress={saveReviewer}
              style={{ marginTop: 16 }}
            >
              Save
            </Button>
            <Button
              mode="text"
              icon="close"
              onPress={closeModal}
              style={{ marginTop: 8 }}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* =====================
   🎨 STYLES
   ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  swipeContainer: { overflow: "visible" },
  cardWrapper: { marginBottom: 12, overflow: "visible" },
  card: {
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: "#f6f6f6",
  },
  cardTitle: { fontWeight: "600" },
  countText: { marginTop: 4, opacity: 0.6 },
  fab: { position: "absolute", right: 24, bottom: 24 },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    borderRadius: 14,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modal: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: { marginBottom: 12, fontWeight: "700" },
  lastStudiedText: { marginTop: 10, fontSize: 12, opacity: 0.5 },
  title: {
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
  },
  reviewerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
