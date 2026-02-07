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

const STORAGE_KEY = "reviewers";

const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
};

export default function ReviewersScreen({ navigation }) {
  const [reviewers, setReviewers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [editingReviewer, setEditingReviewer] = useState(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  /* =====================
     🔄 LOAD ON FOCUS
     ===================== */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await loadSettings();
      await loadReviewers();
    });

    return unsubscribe;
  }, [navigation]);

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

    const reviewersWithCount = await Promise.all(
      reviewersList.map(async (reviewer) => {
        const qnaKey = `reviewer_${reviewer.id}_qa`;
        const qnaStored = await AsyncStorage.getItem(qnaKey);
        const qnaList = qnaStored ? JSON.parse(qnaStored) : [];

        const lastStudiedKey = `reviewer_${reviewer.id}_last_studied`;
        const lastStudied = await AsyncStorage.getItem(lastStudiedKey);

        return {
          ...reviewer,
          count: qnaList.length,
          lastStudied,
        };
      })
    );

    setReviewers(reviewersWithCount);
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

    const updated = editingReviewer
      ? reviewers.map((r) =>
          r.id === editingReviewer.id
            ? { ...r, title: title.trim() }
            : r
        )
      : [...reviewers, { id: uuid.v4(), title: title.trim() }];

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
     👉 SWIPE ACTIONS
     ===================== */
  const renderRightActions = (item) => (
    <View style={styles.swipeActions}>
      <IconButton
        icon="pencil"
        iconColor="#1976d2"
        onPress={() => openEditModal(item)}
      />
      <IconButton
        icon="delete"
        iconColor="#d32f2f"
        onPress={() => deleteReviewer(item)}
      />
    </View>
  );

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
            <View>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.title}
              </Text>

              <Text style={styles.countText}>
                {item.count} Q&A
              </Text>

              {item.lastStudied && (
                <Text style={styles.lastStudiedText}>
                  {formatLastStudied(item.lastStudied)}
                </Text>
              )}
            </View>
            
            <IconButton icon="chevron-right" />
          </Card.Content>
        </Card>
      </View>
    </Swipeable>
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
              icon='check'
              mode="contained"
              onPress={saveReviewer}
              style={{ marginTop: 16 }}
            >
              Save
            </Button>
            <Button mode="text" icon='close' onPress={closeModal} style={{ marginTop: 8 }}>
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
  container: { flex: 1, backgroundColor: "#FFF",  padding: 20 },
  swipeContainer: { overflow: "visible" },
  cardWrapper: { marginBottom: 12, overflow: "visible" },
  card: {
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardTitle: { fontWeight: "600" },
  countText: { marginTop: 4, opacity: 0.6 },
  fab: { position: "absolute", right: 24, bottom: 24 },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    backgroundColor: "#f6f7fb",
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
  lastStudiedText: { marginTop: 2, fontSize: 12, opacity: 0.5 },
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
    height: 56,
  },
});
