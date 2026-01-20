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

export default function ReviewersScreen({ navigation }) {
  const [reviewers, setReviewers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [editingReviewer, setEditingReviewer] = useState(null);

  /* =====================
     🔄 LOAD REVIEWERS
     ===================== */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadReviewers);
    return unsubscribe;
  }, [navigation]);

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

        return { ...reviewer, count: qnaList.length };
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingReviewer(null);
    setTitle("");
    setModalVisible(true);
  };

  const openEditModal = async (item) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingReviewer(item);
    setTitle(item.title);
    setModalVisible(true);
  };

  const closeModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  const saveReviewer = async () => {
    if (!title.trim()) return;

    let updated;

    if (editingReviewer) {
      updated = reviewers.map((r) =>
        r.id === editingReviewer.id
          ? { ...r, title: title.trim() }
          : r
      );
    } else {
      updated = [...reviewers, { id: uuid.v4(), title: title.trim() }];
    }

    await saveReviewers(updated);

    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

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
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );

            const updated = reviewers.filter((r) => r.id !== item.id);
            await saveReviewers(updated);
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
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
      onSwipeableOpen={() =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    >
      <Card
        style={styles.card}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("ReviewerDetails", { reviewer: item });
        }}
      >
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text style={styles.countText}>{item.count} Q&A</Text>
        </Card.Content>
      </Card>
    </Swipeable>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          data={reviewers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          ListEmptyComponent={<EmptyReviewers onPress={openCreateModal} />}
        />

        {reviewers?.count > 0 ? <FAB icon="plus" style={styles.fab} onPress={openCreateModal} /> : null } 

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

            <Button mode="contained" onPress={saveReviewer} style={{ marginTop: 16 }}>
              Save
            </Button>

            <Button mode="text" onPress={closeModal}>
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f7fb",
  },
  card: {
    marginBottom: 12,
    borderRadius: 14,
  },
  cardTitle: {
    fontWeight: "600",
  },
  countText: {
    marginTop: 4,
    opacity: 0.6,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
    marginBottom: 12,
    backgroundColor: "#f6f7fb",
    borderRadius: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 12,
    fontWeight: "700",
  },
});
